// Preferências ficam sempre no localStorage (vale para quem não está
// logado) e também na API quando há sessão.

import { acessibilidade } from '../model/store.js';
import { estaLogado } from '../model/session.js';
import { escolherVarios } from '../view/ui.js';

import HighContrast from './HighContrast.js';
import IncreasedText from './IncreasedText.js';
import CursorHighlight from './CursorHighlight.js';
import Speaker, { falar } from './Speaker.js';
import KeyboardNavigation from './KeyboardNavigation.js';

const RECURSOS = [HighContrast, IncreasedText, CursorHighlight, Speaker, KeyboardNavigation];

const CHAVE_LOCAL = 'vinyl.acessibilidade';

// slug do módulo -> id do recurso na API, preenchido no sincronizar()
let mapaSlugParaId = {};

function normalizar(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function acharRecurso(nome) {
  const chave = normalizar(nome);
  return RECURSOS.find((r) => r.slug === chave || r.apelidos.includes(chave)) || null;
}

export function listarRecursos() {
  return RECURSOS.map(({ slug, rotulo }) => ({ slug, rotulo }));
}

export function preferenciasLocais() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_LOCAL));
    return Array.isArray(salvo) ? salvo : [];
  } catch {
    return [];
  }
}

function salvarLocais(slugs) {
  localStorage.setItem(CHAVE_LOCAL, JSON.stringify(slugs));
}

export function aplicar(slugsAtivos) {
  const ativos = new Set(slugsAtivos);
  for (const recurso of RECURSOS) {
    recurso.aplicar(ativos.has(recurso.slug));
  }
}

// Roda em toda página antes de qualquer chamada de rede, para não piscar.
export function aplicarSalvas() {
  aplicar(preferenciasLocais());
}

export async function sincronizar() {
  if (!estaLogado()) return preferenciasLocais();

  const [catalogo, doUsuario] = await Promise.all([
    acessibilidade.catalogo(),
    acessibilidade.doUsuario(),
  ]);

  mapaSlugParaId = {};
  for (const item of catalogo) {
    // Recurso cadastrado na API sem módulo aqui é ignorado.
    const recurso = acharRecurso(item.name);
    if (recurso) mapaSlugParaId[recurso.slug] = item.id;
  }

  const idsSelecionados = new Set(doUsuario.map((item) => item.accessibilityId ?? item.id));

  const ativos = Object.entries(mapaSlugParaId)
    .filter(([, id]) => idsSelecionados.has(id))
    .map(([slug]) => slug);

  aplicar(ativos);
  salvarLocais(ativos);
  return ativos;
}

export async function definir(slug, ativo) {
  const atuais = new Set(preferenciasLocais());
  if (ativo) atuais.add(slug);
  else atuais.delete(slug);

  const lista = [...atuais];
  aplicar(lista);
  salvarLocais(lista);

  if (!estaLogado()) return;

  // Sem id mapeado o recurso não existe no banco: fica só no navegador.
  const id = mapaSlugParaId[slug];
  if (!id) return;

  if (ativo) await acessibilidade.selecionar(id);
  else await acessibilidade.remover(id);
}

const CHAVE_AVISO = 'vinyl.avisoAcessibilidade';

// Sem sessão, ninguém chega na tela de Acessibilidade (fica atrás de login):
// oferece todos os recursos num popup falado, uma vez por aba. Leitor de
// tela já vem marcado e o botão "Salvar" já vem focado — quem não vê a tela
// só aperta Enter; quem vê pode navegar e marcar mais recursos antes.
export async function oferecerAcessibilidade() {
  if (preferenciasLocais().includes(Speaker.slug)) return;
  if (sessionStorage.getItem(CHAVE_AVISO)) return;
  sessionStorage.setItem(CHAVE_AVISO, '1');

  const emOrdem = [Speaker, ...RECURSOS.filter((r) => r !== Speaker)];

  const mensagem = 'Pressione Enter para ativar o leitor de voz, ou escolha outros recursos de acessibilidade.';
  falar(mensagem);

  const selecionados = await escolherVarios({
    titulo: 'Acessibilidade',
    mensagem,
    opcoes: emOrdem.map(({ slug, rotulo }) => ({ valor: slug, rotulo })),
    selecionados: [Speaker.slug],
    textoConfirmar: 'Salvar',
    focarConfirmar: true,
  });

  if (selecionados) {
    aplicar(selecionados);
    salvarLocais(selecionados);
  }
}
