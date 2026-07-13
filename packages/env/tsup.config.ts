import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
    definitions: 'src/definitions/index.ts',
  },
  format: ['cjs'],
  dts: true,
  clean: true,
});
