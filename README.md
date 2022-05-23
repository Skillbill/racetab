# racetab

## what is it
It's a script that allow to start different job sequentially o parallel each other every one inside it's tab

## installation

Racetab requires gnome-terminal 

```bash
sudo apt install gnome-terminal
```

Enter [src](/src/) folder and do
```
npm install
npm link .
```

Now you have ```racetab``` between executable bash script, if you want command line help just execute 
```
racetab -h
```

### to disinstall
IDK why you have to do it, but is simple
```
npm -g rm racetab
```

## Config file
Using json or yml format you can write what you want to start with ```racetab``` you can make how many config file you wish/need and start task starting from the one you specify calling racetab or the ```main``` one.

Example in JSON format:

```
{
  "workdir": "absolute_path_to_work_dir",
  "tasks":[
    {
      "label": "main",
      "launch": [
        "test",
        "altro test"
      ]
    },
    {
      "label": "test",
      "cmd": "python"
    },
    {
      "label": "altro test",
      "cmd": "echo \"test\""
    },
    {
      "label": "after",
      "cmd": "the other task will start after my end",
      "launch": [
        "altro test",
        "test"
      ]
    }
  ]
}
```
Example in yml format:
```
workdir: absolute_path_to_workdir
tasks:
- label: main
  launch:
  - test
  - altro test
- label: test
  cmd: python
- label: altro test
  cmd: echo "test"
- label: after
  cmd: echo "the other task will start after my end"
  launch:
  - altro test
  - test
```
As you can see, you can specify a workdir where all task will be executed and a list of task.

Every task can have a ```cmd``` or ```launch``` or both, exists another option ```regex``` we will speak of it soon.

When a task contain:
- only ```cmd``` that command will be execute in it's tab
- only ```launch``` that tasks will be started parallel to each other
- both ```cmd``` and ```launch``` will be executed the command ```cmd``` and after its termination will be started the tasks specified by label in ```launch``` list
- finally if ```cmd```, ```launch``` and ```regex``` are all inside a task, ```cmd``` get started, its output will be processed and when the specified regex will match, the others tasks inside ```launch``` will start parallely

## simple launch
As you can see, syntax is simple, let's go through, if you want to start running a task and nexts ones in a config file you can simple:
```
racetab -c absolute_or_relative_path_to_config_file -t task_label -d path_to_workdir
``` 
if you do
```
racetab -c absolute_or_relative_path_to_config_file -d path_to_workdir
```
task with label main will be started if exists.

```-d``` option, is optional, it indicate a dir where tasks will be executed and if a workdir is in config file that one override this option.

## user config
Obviously you can save yours config file for use them more comfortably.

You can create a folder
```
mkdir -p ~/.config/racetab
```

put there yours config file with extension json/yml

than launch one of them 
(e.g. main task of ~/.config/racetab/my_project.yml) easily running:
```
racetab -c my_project
```
