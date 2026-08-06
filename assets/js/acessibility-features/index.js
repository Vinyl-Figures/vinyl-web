// Reúne os recursos de acessibilidade e cuida de onde eles ficam salvos.
//
// A API guarda os recursos no banco (GET /accessibility devolve id + name),
// então o front não pode assumir ids fixos: ele casa o nome cadastrado com
// o módulo local pelos apelidos de cada recurso.
//
// Onde a preferência é salva:
//  - sempre no localStorage, para valer já na próxima página, inclusive
//    para quem não está logado (a rota da API exige token);
//  - também na API, quando há sessão, para seguir o usuário entre aparelhos.

import { acessibilidade } from '../model/store.js';
import { estaLogado } from '../model/session.js';

import HighContrast from './HighContrast.js';
import IncreasedText from './IncreasedText.js';
import CursorHighlight from './CursorHighlight.js';
import Speaker from './Speaker.js';
import KeyboardNavigation from './KeyboardNavigation.js';

const RECURSOS = [HighContrast, IncreasedText, CursorHighlight, Speaker, KeyboardNavigation];

const CHAVE_LOCAL = 'vinyl.acessibilidade';

// Preenchido no sincronizar(): slug do módulo -> id do recurso na API.
let mapaSlugParaId = {};

// "Alto Contraste" e "alto-contraste" viram a mesma coisa.
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

// --- Preferências salvas no navegador ---

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

// --- Aplicação ---

// Liga os recursos da lista e desliga todos os outros.
export function aplicar(slugsAtivos) {
  const ativos = new Set(slugsAtivos);
  for (const recurso of RECURSOS) {
    recurso.aplicar(ativos.has(recurso.slug));
  }
}

// Aplica o que já está salvo no navegador. Roda em toda página, antes
// de qualquer chamada de rede, para não haver piscada de conteúdo.
export function aplicarSalvas() {
  aplicar(preferenciasLocais());
}

// --- Sincronização com a API ---

// Busca o catálogo de recursos e o que o usuário tem selecionado,
// aplica na tela e guarda no navegador. Só funciona logado.
export async function sincronizar() {
  if (!estaLogado()) return preferenciasLocais();

  const [catalogo, doUsuario] = await Promise.all([
    acessibilidade.catalogo(),
    acessibilidade.doUsuario(),
  ]);

  mapaSlugParaId = {};
  for (const item of catalogo) {
    const recurso = acharRecurso(item.name);
    // Recurso cadastrado na API sem módulo correspondente aqui:
    // não dá para aplicar, então é ignorado em silêncio.
    if (recurso) mapaSlugParaId[recurso.slug] = item.id;
  }

  const idsSelecionados = new Set(
    doUsuario.map((item) => item.accessibilityId ?? item.id)
  );

  const ativos = Object.entries(mapaSlugParaId)
    .filter(([, id]) => idsSelecionados.has(id))
    .map(([slug]) => slug);

  aplicar(ativos);
  salvarLocais(ativos);
  return ativos;
}

// Liga ou desliga um recurso. Aplica na hora, salva no navegador
// e tenta salvar na API quando há sessão.
export async function definir(slug, ativo) {
  const atuais = new Set(preferenciasLocais());
  if (ativo) atuais.add(slug);
  else atuais.delete(slug);

  const lista = [...atuais];
  aplicar(lista);
  salvarLocais(lista);

  if (!estaLogado()) return;

  const id = mapaSlugParaId[slug];
  // Sem id mapeado o recurso não existe no banco: fica só no navegador.
  if (!id) return;

  if (ativo) await acessibilidade.selecionar(id);
  else await acessibilidade.remover(id);
}
