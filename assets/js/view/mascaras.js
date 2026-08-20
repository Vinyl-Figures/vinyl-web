


export function apenasDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

export function mascararCpf(digitos) {
  return digitos.slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascararCep(digitos) {
  return digitos.slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}


export function mascararTelefone(digitos) {
  const d = digitos.slice(0, 11);
  const meio = d.length <= 10 ? /(\d{4})(\d)/ : /(\d{5})(\d)/;
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(meio, '$1-$2');
}

export function aplicarMascara(input, formatador) {
  if (!input) return;
  input.addEventListener('input', () => {
    input.value = formatador(apenasDigitos(input.value));
  });
}
