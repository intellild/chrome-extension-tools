import cheerio from 'cheerio'
import { ViteDevServer } from 'vite'
import { isNumber } from './helpers'
import { dirname, join, relative } from './path'
import { getRpceAPI } from './plugin_helpers'
import { CrxPlugin } from './types'

export const htmlScriptSrcUrls = (): CrxPlugin => {
  let server: ViteDevServer | undefined
  let root: string | undefined
  return {
    name: 'html-script-src-urls',
    crx: true,
    enforce: 'post',
    configureServer(s) {
      server = s
    },
    buildStart({ plugins = [] }) {
      root = root ?? getRpceAPI(plugins)?.root
    },
    renderCrxHtml(source, { id }) {
      const $ = cheerio.load(source)

      $('script[src]')
        .not('[data-rollup-asset]')
        .not('[src^="http:"]')
        .not('[src^="https:"]')
        .not('[src^="data:"]')
        .attr('type', 'module')
        .attr('src', (i, value) => {
          let result: string
          const { port } = server?.config.server ?? {}
          if (isNumber(port)) {
            const relPath = relative(root!, id)
            const relDir = dirname(relPath)
            const urlBase = `http://localhost:${port}`
            const urlPath =
              relDir === '.' ? value : join(relDir, value)

            // TODO: don't use vite server url if mv3
            result = [urlBase, urlPath].join(
              urlPath.startsWith('/') ? '' : '/',
            )
          } else {
            result = value.replace(/\.[jt]sx?/g, '.js')
          }
          return result
        })

      return $.html()
    },
  }
}