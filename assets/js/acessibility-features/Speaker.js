


const sintetizador = window.speechSynthesis;
let ativo = false;



function nomeDoElemento(elemento) {
  const rotuloAria = elemento.getAttribute?.('aria-label');
  if (rotuloAria) return rotuloAria;

  if (elemento.tagName === 'IMG') return elemento.alt || '';

  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName)) {
    const rotulo = elemento.labels?.[0]?.textContent || elemento.placeholder || '';
    if (elemento.tagName === 'SELECT' && elemento.selectedOptions?.[0]) {
      return `${rotulo.trim()}, selecionado ${elemento.selectedOptions[0].textContent.trim()}`;
    }
    return rotulo.trim();
  }

  return (elemento.textContent || '').trim();
}

const PAPEL_POR_TIPO_INPUT = {
  checkbox: 'caixa de seleção',
  radio: 'opção',
  search: 'campo de busca',
  email: 'campo de e-mail',
  password: 'campo de senha',
  tel: 'campo de telefone',
  number: 'campo numérico',
  submit: 'botão',
  reset: 'botão',
  button: 'botão',
};

function papelDoElemento(elemento) {
  const tag = elemento.tagName;

  if (/^H[1-6]$/.test(tag)) return `título nível ${tag[1]}`;
  if (tag === 'A') return elemento.hasAttribute('href') ? 'link' : '';
  if (tag === 'BUTTON') return 'botão';
  if (tag === 'SELECT') return 'lista de opções';
  if (tag === 'TEXTAREA') return 'campo de texto';
  if (tag === 'INPUT') return PAPEL_POR_TIPO_INPUT[elemento.type] || 'campo de texto';
  return '';
}

function estadoDoElemento(elemento) {
  const estados = [];

  const atual = elemento.getAttribute('aria-current');
  if (atual && atual !== 'false') estados.push('página atual');

  const expandido = elemento.getAttribute('aria-expanded');
  if (expandido) estados.push(expandido === 'true' ? 'expandido' : 'recolhido');

  if (elemento.tagName === 'SUMMARY') {
    estados.push(elemento.parentElement?.open ? 'expandido' : 'recolhido');
  }

  if (elemento.tagName === 'INPUT' && ['checkbox', 'radio'].includes(elemento.type)) {
    estados.push(elemento.checked ? 'marcado' : 'desmarcado');
  }

  if (elemento.required) estados.push('obrigatório');
  if (elemento.disabled) estados.push('desabilitado');
  if (elemento.getAttribute('aria-invalid') === 'true') estados.push('inválido');
  if (elemento.getAttribute('aria-busy') === 'true') estados.push('carregando');

  return estados;
}

function textoDoElemento(elemento) {
  if (!elemento) return '';

  const partes = [nomeDoElemento(elemento), papelDoElemento(elemento), ...estadoDoElemento(elemento)];
  return partes.filter(Boolean).join(', ');
}

export function falar(texto) {
  if (!texto || !sintetizador) return;

  sintetizador.cancel();

  const fala = new SpeechSynthesisUtterance(texto.slice(0, 300));
  fala.lang = 'pt-BR';
  fala.rate = 1;
  sintetizador.speak(fala);
}

function aoFocar(evento) {
  falar(textoDoElemento(evento.target));
}

function aoMudar(evento) {
  const alvo = evento.target;
  if (alvo.matches('input, select, textarea')) falar(textoDoElemento(alvo));
}

function aoClicar(evento) {


  if (evento.target.closest('a, button, input, select, textarea, label, summary')) return;

  const alvo = evento.target.closest('p, h1, h2, h3, li, td, th, dd, dt, address, caption');
  if (alvo) falar(textoDoElemento(alvo));
}

function aoTeclar(evento) {
  if (evento.key === 'Escape') sintetizador.cancel();
}

function aoNavegar(evento) {
  falar(evento.detail);
}






let observadorAoVivo = null;

function aoAdicionarNo(mutacoes) {
  for (const mutacao of mutacoes) {
    for (const no of mutacao.addedNodes) {
      if (no.nodeType !== Node.ELEMENT_NODE) continue;
      if (!no.closest('[aria-live]')) continue;
      falar((no.textContent || '').trim());
    }
  }
}

function observarAvisos() {
  observadorAoVivo = new MutationObserver(aoAdicionarNo);
  observadorAoVivo.observe(document.body, { childList: true, subtree: true });
}

export default {
  slug: 'leitor-de-tela',
  rotulo: 'Leitor de tela',
  apelidos: ['leitor-de-tela', 'leitor', 'screen-reader', 'speaker', 'narrador'],

  aplicar(deveAtivar) {
    if (!sintetizador || ativo === deveAtivar) return;
    ativo = deveAtivar;

    if (deveAtivar) {
      document.documentElement.setAttribute('data-a11y-leitor', 'ativo');
      document.addEventListener('focusin', aoFocar);
      document.addEventListener('change', aoMudar);
      document.addEventListener('click', aoClicar);
      document.addEventListener('keydown', aoTeclar);
      document.addEventListener('a11y:navegacao', aoNavegar);
      observarAvisos();
    } else {
      document.documentElement.removeAttribute('data-a11y-leitor');
      document.removeEventListener('focusin', aoFocar);
      document.removeEventListener('change', aoMudar);
      document.removeEventListener('click', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('a11y:navegacao', aoNavegar);
      observadorAoVivo?.disconnect();
      observadorAoVivo = null;
      sintetizador.cancel();
    }
  },
};
