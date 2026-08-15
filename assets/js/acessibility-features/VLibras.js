const URL_BASE = 'https://vlibras.gov.br/app'
const URL_SCRIPT = `${URL_BASE}/vlibras-plugin.js`
const ID_SCRIPT = 'vinyl-vlibras-script'
const ID_WIDGET = 'vinyl-vlibras-widget'
const ID_LAUNCHER = 'vinyl-vlibras-launcher'
const URL_CSS = new URL('../../css/vlibras.css', import.meta.url).href

let ativo = false
let widgetInicializado = false
let carregamento = null

// adiciona CSS personalizado de VLibras
function getCss() {
    if (document.querySelector('link[data-vinyl-vlibras]')) return

    const link = document.createElement('link')

    link.rel = 'stylesheet'
    link.href = URL_CSS
    link.dataset.vinylVlibras = 'true'
    document.head.append(link)
}

// retorna elemento principal do VLibras
function getWidget() {
    return document.getElementById(ID_WIDGET)
}

// Cria estrutura em HTML do plugin
function criarEstrutura() {
    const existente = getWidget()
    if (existente) return existente

    const widget = document.createElement('div')
    widget.id = ID_WIDGET
    widget.setAttribute('vw', '')
    widget.className = 'enabled'
    widget.hidden = true

    // atributos que serão preenchidos pelo plugin
    const btn = document.createElement('div')
    btn.setAttribute('vw-access-button', '')
    btn.className = 'active'

    const wrapper = document.createElement('div')
    wrapper.setAttribute('vw-plugin-wrapper', '')

    const top = document.createElement('div')
    top.className = 'vw-plugin-top-wrapper'

    wrapper.append(top)
    widget.append(btn, wrapper)
    document.body.append(widget)

    return widget
}

// baixa script do VLibras
function carregarScript() {
    if (window.VLibras?.Widget) return Promise.resolve()
    if (carregamento) return carregamento

    carregamento = new Promise((resolve, reject) => { // impede criar vártas tags script
        let script = document.getElementById(ID_SCRIPT)
        let limite

        function limpar() {
            window.clearTimeout(limite)
            script?.removeEventListener('load', concluir)
            script?.removeEventListener('error', falhar)
        }

        function concluir() {
            limpar()

            if (window.VLibras?.Widget) return resolve()
            else reject(new Error('O VLibras foi carregado, mas houve erro na inicialização'))
        }

        function falhar() {
            limpar()
            reject(new Error('Não foi possível carregar o VLibras'))
        }

        limite = window.setTimeout(falhar, 15000) // evita carregamento infinito
        const novoScript = !script

        if (novoScript) {
            script = document.createElement('script')
            script.id = ID_SCRIPT
            script.src = URL_SCRIPT
            script.async = true
            script.referrerPolicy = 'strict-origin-when-cross-origin'
        }

        script.addEventListener('load', concluir, {once: true})
        script.addEventListener('error', falhar, {once: true})

        if (novoScript) document.head.append(script)
    }).catch(error => {
        carregamento = null
        throw error
    })

    return carregamento
}

// inicializa widget apenas uma vez
function inicializarWidget() {
    if (widgetInicializado) return

    if (document.readyState !== 'complete') {
        new window.VLibras.Widget(URL_BASE)
        widgetInicializado = true
        return
    }

    const onloadAnterior = window.onload

    window.onload = null
    new window.VLibras.Widget(URL_BASE)

    const inicializadorVLibras = window.onload
    window.onload = onloadAnterior

    inicializadorVLibras?.()
    widgetInicializado = true
}

function criarLauncher() {
    if (document.getElementById(ID_LAUNCHER)) return

    const area = document.createElement('div')
    area.id = ID_LAUNCHER
    area.className = 'vlibras-launcher'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'vlibras-launcher-btn'
    btn.setAttribute('aria-describedby', `${ID_LAUNCHER}-status`)
    btn.textContent = 'Libras'

    const status = document.createElement('span')
    status.id = `${ID_LAUNCHER}-status`
    status.className = 'vlibras-launcher-status'
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    status.textContent = 'Abrir o tradutor de Português para Libras'

    btn.addEventListener('click', async () => {
        btn.disabled = true
        btn.setAttribute('aria-busy', 'true')
        btn.textContent = 'Carregando...'
        status.textContent = 'Carregando o tradutor de Libras'

        const widget = criarEstrutura()

        try {
            await carregarScript()

            if (!ativo) {
            widget.hidden = true
            return
        }

        inicializarWidget()

        const botaoOficial = widget.querySelector('[vw-access-button]')

        if (!botaoOficial?.children.length) {
            throw new Error('A interface do VLibras não foi inicializada')
        }

        widget.hidden = false
        botaoOficial.setAttribute('role', 'button')
        botaoOficial.tabIndex = 0

        area.remove()
        botaoOficial.focus({preventScroll: true})
            
            window.setTimeout(() => {
                if (!ativo || !document.body.contains(botaoOficial)) return
                botaoOficial.click()
            }, 100);
        } catch (erro) {
            widget.hidden = true

            btn.disabled = false
            btn.removeAttribute('aria-busy')
            btn.textContent = 'Tentar Libras novamente'
            status.textContent = 'Não foi possível carregar o VLibras. Tente novamente mais tarde'

            console.warn(erro)
        }
    })

    area.append(btn, status)
    document.body.append(area)
}

function ativar() {
    getCss()

    const widget = criarEstrutura()
    widget.hidden = false

    if (widgetInicializado) return

    carregarScript()
        .then(() => {
            if (!ativo) return

            inicializarWidget()
            widget.hidden = false
        })
        .catch(erro => {
            widget.hidden = true
            console.warn('Não foi possível inicializar o VLibras', erro)

            if (ativo) criarLauncher()
        })
}

function desativar() {
    document.getElementById(ID_LAUNCHER)?.remove()
    const widget = getWidget()
    if (widget) widget.hidden = true
}

export default {
    slug: 'vlibras',
    rotulo: 'Tradução em Libras (VLibras)',
    apelidos: ['vlibras', 'libras'],

    aplicar(deveAtivar) {
        ativo = deveAtivar
        if (ativo) return ativar()
        else desativar()
    }
}