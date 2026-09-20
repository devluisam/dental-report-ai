/**
 * Sem este arquivo o Next não executa o Tailwind: as diretivas de
 * `app/globals.css` não compilam e a aplicação abre sem estilo nenhum.
 */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
