const { setYolo } = require('./state');
const readFileTool = require('./read');
const readLinesTool = require('./readLines');
const grepTool = require('./grep');
const lsTool = require('./ls');
const treeTool = require('./tree');
const writeTool = require('./write');
const mkdirTool = require('./mkdir');
const touchTool = require('./touch');
const rmTool = require('./rm');

module.exports = {
  setYolo,
  readFileTool,
  readLinesTool,
  grepTool,
  lsTool,
  treeTool,
  writeTool,
  mkdirTool,
  touchTool,
  rmTool
};
