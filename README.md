<!-- @format -->

# data-import-fix

This is a workaround for [node.js issue #51956](https://github.com/nodejs/node/issues/51956) where data URLs cannot load modules from the disk, throwing either `TypeError: Invalid URL` or `ERR_UNSUPPORTED_RESOLVE_REQUEST: Invalid relative URL or base scheme is not hierarchical.`

Effectively, this module allows you to import stuff from node_modules in a data URL.

This works by tracking what folder each base64 URL is spawned from, then resolving its external modules from that path on disk.

This uses the [new register hooks API](https://nodejs.org/api/module.html#hooks) introduced as stable in node 20+. This package therefore requires node 20+.

## Usage:

Install data-import-fix to your package.json, reinstall with npm/yarn/pnpm.

Run your program with

```
node --import data-import-fix [node args] <my script>
```

Data URLs should now be able to import from the disk.