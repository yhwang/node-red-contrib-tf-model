const shell = require('shelljs');
const path = require('path');

// copy index.html to dist
shell.cp(
    path.join(__dirname, '..', 'src', 'index.html'),
    path.join(__dirname, '..', 'dist')
);
