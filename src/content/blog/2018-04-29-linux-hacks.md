---
title: Linux Hacks
pubDate: 2018-04-29
category: linux-hacks
tags: linux
author: Akshay Sinha
description: Linux Hacks for day to day
heroImage: ../../assets/linux.jpg
---

## Linux Hacks

Here is a goto list of linux hacks that I find useful in my day to day. I will keep on updating it as I gather more. Please feel free to respond back in comments in case you want me to add some more

### Random Password Generator

Following two scripts generate a random string, a sub set of which, or the whole string can be used as an password. Give it a try.

    date +%s | sha256sum | base64 | head -c 32 ; echo

### Removing trailing spaces

    echo "   lol  " | xargs

Xargs will do the trimming for you. It's one command/program, no parameters, returns the trimmed string, as easy as that!
Note: this doesn't remove the internal spaces so "foo bar" stays the same. It does NOT become "foobar".

### Breaking a file into smaller chunks

    # By Size
    split -b 100M -d -a 3 forever.log.bck forever

    # By number of Lines (input and output are just two directories)
    split -l 2500 input/result.txt output/result.txt

### Search and replace a string in all files in my present directory

    sed -i -- 's/STR1/STR2/g' *

This replaces all occurances of _STR1_ with _STR2_ in all files in my current directory

### Delete logs older than X days

    find /path/to/files* -mtime +X -exec rm {} \;

### Total number of lines in all the files in current directory

    find . -type f -exec cat {} + | wc -l  

### Install FTP on rhel or centos

    yum install vsftpd -y
    yum install ftp -y
    service vsftpd start

### Install jq

[jq](https://stedolan.github.io/jq/) is a really cool tool if you work with json's a lot. Its like sed for json. You can use it to slice and filter and map and transform structured data with the same ease that sed, awk, grep and friends let you play with text.

Installing it is an breeze too

    wget -O jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64
    chmod +x ./jq
    cp jq /usr/bin
    rm jq

### Using tcpdump

Although a whole seperate blog could be ritten about tcpdump and its usage. Here is a very short, quick and dirty SOP to get it up and running
Please note that sudo access is required for this

**Install tcpdump**

    yum install tcpdump
    

**Script to capture network traffic on a port and write a Wireshark-compatible pcap file**


    # Use tcpdump to capture network traffic and write a Wireshark-compatible pcap file:
    tcpdump -s 0 port 443 -w mypcapfile.pcap

    # Terminate the capture with a ctl-c

    # gzip the file:
    gzip mypcapfile.pcap
    
 
**Capture traffic on particular interface**


    tcpdump -i eth0
    
    
**Display Available Interfaces**


    tcpdump -D
    

**Read Captured Packets File**


    tcpdump -r mypcapfile.pcap
    

**Capture Packets from source IP**


    tcpdump -i eth0 src 172.176.98.1
    
    
**Capture Packets from destination IP**


    tcpdump -i eth0 dst 172.176.98.1
    
    
    
### Adding a Script to auto start on reboot/startup

At times, you need a way to make a script auto start at the time of reboot's ans startup. There are multiple ways to accomplish this. 

However the one I find most effective is :

* First create a init.d script for your operation that supports `start|stop|restart` operations. For example, here is a sample `init.d` script to start/stop ldap


        #!/bin/sh
        # ldap          Init script for running the ldap client daemon
        #
        # Author:       Akshay Sinha <akshaysin@gmail.com>
        #
        # chkconfig: - 63 37
        #
        # description: Start's Stops ldap.
        # processname: ldap
        # config: /opt/IBM/ldap/V6.3.1/sbin/ibmslapd
        
        #
        # Below is the chkconfig syntax for auto startup at different run levels
        # Note runlevel 1 2 and 3, 69 is the Start order and 68 is the Stop order
        # Make sure these are unique by looking into /etc/rc.d/*
        # Also below is the description which is necessary.
        #
        # chkconfig: 123 63 37
        # description: Description of the Service
        #
        # Below is the source function library
        #
        . /etc/init.d/functions
        #
        #
        # Below is the Script to start stop ldap services
        #
        case "$1" in
        start)
        printf "Starting service : LDAP\n"
        curl --output /dev/null --silent --head --fail ldap://localhost:389
        if [[ $? -eq 0 ]]; then
            printf "LDAP already running. Doing nothing\n"
        else
            /opt/IBM/ldap/V6.3.1/sbin/ibmslapd -I isamldap
        fi
        ;;
        stop)
        printf "Stopping service : LDAP\n"
        curl --output /dev/null --silent --head --fail ldap://localhost:389
        if [[ $? -eq 0  ]]; then
            /opt/IBM/ldap/V6.3.1/sbin/ibmslapd -I isamldap -k
            printf "LDAP Stopped gracefully\n"
        else
            printf "LDAP Already stopped. Doing nothing\n"
        fi
        ;;
        restart)
        printf "Restarting service : LDAP\n"
        curl --output /dev/null --silent --head --fail ldap://localhost:389
        if [[ $? -eq 0 ]]; then
            /opt/IBM/ldap/V6.3.1/sbin/ibmslapd -I isamldap -k
            printf "LDAP Stopped gracefully. Starting it now\n"
            sleep 2
            /opt/IBM/ldap/V6.3.1/sbin/ibmslapd -I isamldap
        else
            printf "LDAP Already stopped. Starting it now\n"
            /opt/IBM/ldap/V6.3.1/sbin/ibmslapd -I isamldap
        fi
        ;;
        *)
        printf "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
        esac
 
* Next run the `chkconfig --list` command to list all current run levels for different programs
* Run `chkconfig --list ldap`
* Run `chkconfig ldap on`
* Run `chkconfig --list ldap` again


That's it.