---
title: Getting started with Ansible using Vagrant
pubDate: 2018-04-20
category: devops
tags: vagrant, ansible
author: Akshay Sinha
description: Getting started with Ansible using Vagrant
heroImage: ../../assets/devops.jpg
---

Vagrant is an wonderful tool if you have a need to provision throw away development envs every now and then. I usually use vagrant to provision vm locally for any new poc that I am working on and once all looks good locally, I can choose to throw away the local setup or archive it for future use.

Ansible is an python based, agentless, automation engine which is use to automate configuration management across various hosts remotely and securely.

Since vagrant gives me the option of spinning off throw away vms on the fly, its a good fit if you are testing waters out with ansible. Enough talk, lets dive in

### Prerequisites

* [Vagrant](https://www.vagrantup.com/downloads.html)
* [Virtual Box](https://www.virtualbox.org/wiki/Downloads)
* Enough resources (CPU and RAM) locally to support multiple VM's.

### Setting up VM's

Create following `Vagrantfile` in your workspace :

    Vagrant.configure("2") do |config|

      config.vm.define "ansible" do |ansible|
    	ansible.vm.box = "bento/centos-7.4"
    	ansible.vm.network :private_network, ip: "192.168.32.170"
    	ansible.vm.network :forwarded_port, guest: 22, host: 17022, id: "ssh"
      end

      config.vm.define "node1" do |node1|
    	node1.vm.box = "bento/centos-7.4"
    	node1.vm.network :private_network, ip: "192.168.32.171"
    	node1.vm.network :forwarded_port, guest: 22, host: 17122, id: "ssh"
      end

      config.vm.define "node2" do |node2|
    	node2.vm.box = "bento/centos-7.4"
    	node2.vm.network :private_network, ip: "192.168.32.172"
    	node2.vm.network :forwarded_port, guest: 22, host: 17222, id: "ssh"
      end

      config.vm.define "node3" do |node3|
    	node3.vm.box = "bento/centos-7.4"
    	node3.vm.network :private_network, ip: "192.168.32.173"
    	node3.vm.network :forwarded_port, guest: 22, host: 17322, id: "ssh"
      end

    end

As can be seen here, I am using `centos-7.4` box as my base image. That was the latest version of centos that was available at the time of writing this.
Another thing to note above is that I have assigned seperate ips and forwarded ports to each box. I like to keep it that way because if you are someone like me who likes to login to these VM's remotely, doing this makes it really easy.

I found this really neat trick by (Scott)[http://www.thisprogrammingthing.com/] to assign the forwarded_port by taking the last three digits of ip and clubbing it with 22. so for example, forwarded port for ip `192.168.32.170` becomes `170 && 22` ==> `17022`. This way you can guess the forwarded port of the box on the fly.

Finally execute following command from your terminal in the root of your workspace.

    vagrant up

Now sit back and relax, this will take some time. If all goes well, you should see vagrant provisioning four nodes :

* ansible (This will be used as ansible host)
* node1 ( Test node 1 )
* node2 ( Test node 2 )
* node3 ( Test node 3 )

Make sure all four nodes are up and running by issuing following command

    vagrant status

You can halt and destroy all nodes by using below commands

    vagrant halt
    vagrant destroy

### Exchange SSH keys between nodes.

I love putty but lately I have started cheating on it with [MobaXterm](https://mobaxterm.mobatek.net/). Don't get me wrong, I still love putty, but mobaxterm is proving to quite useful in many ways over putty. Give it a try and let me know if you like it.

Once all four nodes are up and running, ssh to each one of the using username `vagrant` and pasword `vagrant`

In order for ansible to work in a password less manner, we will have to exchange ssh keys for user `vagrant` from ansible host to node1, node2 and node3

On node `ansible` as user `vagrant`

    ssh-keygen
    scp ~/.ssh/id_rsa.pub vagrant@192.168.32.171:/home/vagrant
    scp ~/.ssh/id_rsa.pub vagrant@192.168.32.172:/home/vagrant
    scp ~/.ssh/id_rsa.pub vagrant@192.168.32.173:/home/vagrant

on node `node1` as user `vagrant`

    cat ~/id_rsa.pub >> ~/.ssh/authorized_keys
    rm ~/id_rsa.pub

on node `node2` as user `vagrant`

    cat ~/id_rsa.pub >> ~/.ssh/authorized_keys
    rm ~/id_rsa.pub

on node `node2` as user `vagrant`

    cat ~/id_rsa.pub >> ~/.ssh/authorized_keys
    rm ~/id_rsa.pub        

After this you should be able to ssh from `ansible` to `node1`, `node2` and `node3` in password less manner

###  Installing Ansible

On node `ansible`

    sudo yum install epel-release
    sudo yum install ansible

That's it. Ansible is installted on the host. you should be able to verify its version by invoking following command

    ansible --version

### Using Ansible

**/etc/ansible/hosts**

Lets now use ansible now to test ping on our three nodes. But before we start, lets talk a bit about ansible's hosts file

Ansible keeps track of all of the servers that it knows about through a "hosts" file. We need to set up this file first before we can begin to communicate with our other nodes. Open the file as `root` like this:

    vi /etc/ansible/hosts

You will see a file that has a lot of example configurations commented out. Keep these examples in the file to help you learn Ansible's configuration if you want to implement more complex scenarios in the future. The hosts file is fairly flexible and can be configured in a few different ways. The syntax we are going to use though looks something like this:

    [my_hosts]
    node1 ansible_ssh_host=192.168.32.171
    node2 ansible_ssh_host=192.168.32.172
    node3 ansible_ssh_host=192.168.32.173

The `my_hosts` is just an organizational tag that allow's you to access all hosts listed under that tag with one word. the alias like `node1`, `node2` etc are just alias names to access those nodes.

**ansible group variables**

Ansible lets you define group varliables and common variables using `group_vars` construct. Lets define `vagrant` as our default user for ansible to use when connecting to `my_hosts`. As root :

    mkdir /etc/ansible/group_vars

Within this folder, we can create YAML-formatted files for each group we want to configure:

    vi /etc/ansible/group_vars/my_hosts

Add this code to the file:

    ---
    ansible_ssh_user: vagrant

YAML files start with "---", so make sure you don't forget that part. Save and close this file when you are finished. Now Ansible will always use the `vagrant` user for the `my_hosts` group, regardless of the current user.

If you want to specify configuration details for every server, regardless of group association, you can put those details in a file at /etc/ansible/group_vars/all. Individual hosts vars can be configured by creating files under a directory at /etc/ansible/host_vars

#### Using ansible with simple commands

Ping all of the servers you configured by typing:

    ansible -m ping all

Ansible will return output like this:

    [vagrant@localhost ~]$ ansible -m ping all
    node2 | SUCCESS => {
        "changed": false,
        "ping": "pong"
    }
    node3 | SUCCESS => {
        "changed": false,
        "ping": "pong"
    }
    node1 | SUCCESS => {
        "changed": false,
        "ping": "pong"
    }

The all portion means "all hosts." You could just as easily specify a group:

    ansible -m ping my_hosts

You can also specify an individual host:

    ansible -m ping node1

You can specify multiple hosts by separating them with colons:

    ansible -m ping node1:node2

The shell module lets us send a terminal command to the remote host and retrieve the results. For instance, to find out the disk space usage on all our nodes, we could use

    ansible -m shell -a 'df -kh' all

    [vagrant@localhost ~]$ ansible -m shell -a 'df -kh' all
    node1 | SUCCESS | rc=0 >>
    Filesystem               Size  Used Avail Use% Mounted on
    /dev/mapper/centos-root   41G  1.2G   40G   3% /
    devtmpfs                 486M     0  486M   0% /dev
    tmpfs                    497M     0  497M   0% /dev/shm
    tmpfs                    497M  6.7M  490M   2% /run
    tmpfs                    497M     0  497M   0% /sys/fs/cgroup
    /dev/sda1               1014M  153M  862M  16% /boot
    /dev/mapper/centos-home   20G   33M   20G   1% /home
    vagrant                  953G   71G  883G   8% /vagrant
    tmpfs                    100M     0  100M   0% /run/user/1000

    node3 | SUCCESS | rc=0 >>
    Filesystem               Size  Used Avail Use% Mounted on
    /dev/mapper/centos-root   41G  1.2G   40G   3% /
    devtmpfs                 486M     0  486M   0% /dev
    tmpfs                    497M     0  497M   0% /dev/shm
    tmpfs                    497M  6.7M  490M   2% /run
    tmpfs                    497M     0  497M   0% /sys/fs/cgroup
    /dev/sda1               1014M  153M  862M  16% /boot
    /dev/mapper/centos-home   20G   33M   20G   1% /home
    vagrant                  953G   71G  883G   8% /vagrant
    tmpfs                    100M     0  100M   0% /run/user/1000

    node2 | SUCCESS | rc=0 >>
    Filesystem               Size  Used Avail Use% Mounted on
    /dev/mapper/centos-root   41G  1.2G   40G   3% /
    devtmpfs                 486M     0  486M   0% /dev
    tmpfs                    497M     0  497M   0% /dev/shm
    tmpfs                    497M  6.7M  490M   2% /run
    tmpfs                    497M     0  497M   0% /sys/fs/cgroup
    /dev/sda1               1014M  153M  862M  16% /boot
    /dev/mapper/centos-home   20G   33M   20G   1% /home
    vagrant                  953G   71G  883G   8% /vagrant
    tmpfs                    100M     0  100M   0% /run/user/1000


### Conclusion

This should do to get you started with ansible. Look out for my next blog to go more in depth with ansible's more advanced and useful usage.