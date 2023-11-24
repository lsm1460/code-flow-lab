const fs = require('fs-extra');
const path = require('path');

fs.rmSync(path.resolve(__dirname, './public/viewer'), { recursive: true, force: true });

fs.copySync(path.resolve(__dirname, './temp-viewer'), path.resolve(__dirname, './public/viewer'), { recursive: true });

fs.rmSync(path.resolve(__dirname, './temp-viewer'), { recursive: true, force: true });
