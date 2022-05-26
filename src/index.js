#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs')
const os = require("os");
const path = require('path')
const yaml = require('js-yaml');
const { exec } = require('child_process');

program
  .description('shell script that allow to launch in different tab syncronus or sequentially group of script eventually waiting for an output based on config file in json or yml')
  .version('1.0.0')
  .requiredOption('-c, --config <path_config_file/task_nam>', 'task config file path')
  .option('-f, --format <JSON/YML>', 'task config file name format', 'JSON')
  .option('-t, --task <task_label>', 'task to execute label', 'main')
  .option('-d, --dir <path_dir>', 'relative or absolute path to dir where command in config file have to be run', './')
  .option('-l, --launch', 'internal option, used for know when to not launch a new terminal window', false)
  .option('-w, --waiting', 'internal option, used for know when the script has to do launch command after end of current command', false)
  .option('-r, --regex <regex>', 'internal option, regex to know when a command is ready', null)
  .option('-s, --stop-propagation', 'when setted if a task has both cmd and launch the launch part will be ignored ', false)
  .option('-x, --execute <task_label>', 'shortcut for "-t <task_label> --launch"', undefined)
  .option('-i, --instruction <command>', 'override task cmd', undefined)
  .parse()

const options = program.opts()
const scriptName = 'racetab'
let config = undefined

if(options.execute){
  options.task = options.execute
  options.launch = true
}

if(!fs.existsSync(options.config) || !fs.lstatSync(options.config).isFile()){
  const userConfig = `${os.homedir()}/.config/racetab/${options.config}`
  if(fs.existsSync(`${userConfig}.json`)){
    options.config = `${userConfig}.json`
  }else if(fs.existsSync(`${userConfig}.yml`)){
    options.config = `${userConfig}.yml`
    options.format = 'yml'
  }else{
    console.log(`not valid config file or bad location/extension if it is in ${os.homedir()}/.config/racetab`)
    process.exit()
  }
}else{
  options.config = path.resolve(options.config)
}

switch(options.format.toUpperCase()){
  case 'JSON':
    config = JSON.parse(fs.readFileSync(options.config))
    break
  case 'YML':
  case 'YAML':
    config = yaml.load(fs.readFileSync(options.config))
    break
  default:
    console.log('not supported format')
    process.exit()
}


options.dir = path.resolve(config.workdir ? config.workdir : options.dir)

const tasks = {}
config.tasks.forEach(
  task => tasks[task.label] = task
)
const task = tasks[options.task]
if(options.instruction){
  task.cmd = options.instruction
}

const waitenter = 'echo \\"press enter to close\\" && read'
const itSelfStringTask = (taskLabel) => `${scriptName} -c "${options.config}" -x "${taskLabel}" -f "${options.format}" -d "${options.dir}" ${options.stopPropagation ? '-s':''}`
const terminalItSelfTask = (taskLabel, newWindow = false, instruction = false) => `gnome-terminal --working-directory "${options.dir}" ${newWindow?'--maximize':'--tab'} -- ${itSelfStringTask(taskLabel)} ${instruction ? `-i "${options.instruction}"` : ""}`
const commandLaunchString = (cmd) => `gnome-terminal --working-directory ${options.dir} --tab --title "${task.label}" -- bash -c "${cmd}`
const escapeQuote = (string) => string.replace(RegExp('"','g'),'\\"')
const escapeOthers = (string) => string.replace(RegExp('\`','g'),'\\`')

if(options.launch){
  if(options.regex){
    const regex = RegExp(options.regex)
    let launched = false
    process.stdin.resume();
    process.stdin.on('data', (data) => {
      process.stdout.write(data)
      if(!launched && regex.test(data) && task.launch){
        launched = true
        task.launch.forEach(taskLabel => exec(terminalItSelfTask(taskLabel)))
      }
    });
    process.stdin.on('end', () => {
      process.exit()
    });
  }else{
    if(task.cmd && (!task.launch || options.stopPropagation)){
      exec(`${commandLaunchString(escapeOthers(escapeQuote(task.cmd)))}; ${waitenter}"`)
    }else if((!task.cmd && task.launch) ||
      (task.cmd && task.launch && options.waiting)
    ){
      task.launch.forEach(taskLabel => exec(terminalItSelfTask(taskLabel)))
    }else if(task.cmd && task.launch && !task.regex){
      exec(`${commandLaunchString(escapeOthers(escapeQuote(task.cmd)))} && ${escapeQuote(itSelfStringTask(task.label))} -w; ${waitenter}" `)
    }else if(task.cmd && task.launch && task.regex){
      exec(`${commandLaunchString(escapeOthers(escapeQuote(task.cmd)))} 2>&1| ${escapeQuote(itSelfStringTask(task.label))} -w -r \"${task.regex}\"; ${waitenter}" `)
    }else{
      console.log('UNSUPPORTED options and task')
      process.exit()
    }
  }
}else{
  exec(terminalItSelfTask(task.label, true, options.instruction !== undefined))
}