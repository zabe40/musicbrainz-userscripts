import { build } from '@kellnerd/userscript-bundler';

build({
    userscriptSourcePath: 'src/userscripts/',
    docSourcePath: 'doc/',
    outputPath: 'dist/',
    readmePath: 'README.md',
});
