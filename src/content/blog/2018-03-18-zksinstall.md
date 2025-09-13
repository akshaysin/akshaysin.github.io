---
title: Installing Standalone Zookeeper on RHEL and set it up as a service
description: This goes through installation and setup of zookeeper
pubDate: 2018-03-18
updatedDate: 2018-03-18
category: Devops
heroImage: ../../assets/devops.jpg
---

## Installation

First Lets make sure java is installed

    yum install java-1.8.0-openjdk-src.x86_64

Download the latest version of zookeeper and pick the latest avaiable.

    cd /tmp && mkdir zookeeper && cd zookeeper/ && wget http://apache.org/dist/zookeeper/current/zookeeper-3.4.10.tar.gz

Add zookeeper user

    useradd zookeeper & passwd zookeeper

Unzip zookeeper binaries 

    cd /opt && tar xvzf /tmp/zookeeper/zookeeper-3.4.10.tar.gz

Create the softlink `/opt/zookeeper`

    ln -s /opt/zookeeper-3.4.10 /opt/zookeeper

Create `/var/lib/zookeeper` to store the `idfile` and `data`

    mkdir /var/lib/zookeeper

Rename `zoo_sample.cfg` to `zoo.cfg`

    cd /opt/zookeeper/conf && cp zoo_sample.cfg zoo.cfg

Update the zoo.cfg to update the new datadir

    dataDir=/var/lib/zookeeper

Add following line to `/opt/zookeeper/bin/zkServer.sh`: `ZOO_LOG_DIR=/opt/zookeeper` before line `# use POSTIX interface, symlink is followed automatically`

Change owernership and permissions on all zookeeper relared dirs

    chown -R zookeeper:zookeeper /opt/zookeeper-3.4.10 && chown -R zookeeper:zookeeper /opt/zookeeper && chown -R zookeeper:zookeeper /var/lib/zookeeper

Add `zookeper` user to sudoers as NOPASSWD : 

    zookeeper ALL=(ALL) NOPASSWD: ALL

FInally start stop the service from `/opt/zookeeper/` dir as 

    bin/zkServer.sh start

At this time we are done with the installation and this next section talks about how to set it up as a service

## Setting it as a Service

Create following file in /etc/init.d folder by the name zookeeper

    #!/bin/bash

    # /etc/init.d/zookeeper

    # Licensed to the Apache Software Foundation (ASF) under one or more
    # contributor license agreements.  See the NOTICE file distributed with
    # this work for additional information regarding copyright ownership.
    # The ASF licenses this file to You under the Apache License, Version 2.0
    # (the "License"); you may not use this file except in compliance with
    # the License.  You may obtain a copy of the License at
    #
    #     http://www.apache.org/licenses/LICENSE-2.0
    #
    # Unless required by applicable law or agreed to in writing, software
    # distributed under the License is distributed on an "AS IS" BASIS,
    # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    # See the License for the specific language governing permissions and
    # limitations under the License.

    #
    # ZooKeeper
    #
    # chkconfig: 2345 89 9
    # description: zookeeper

    # ZooKeeper install path (where you extracted the tarball)
    ZOOKEEPER='/opt/zookeeper'

    source /etc/rc.d/init.d/functions
    source $ZOOKEEPER/bin/zkEnv.sh

    RETVAL=0
    PIDFILE="/var/lib/zookeeper/data/zookeeper_server.pid"
    desc="ZooKeeper daemon"

    start() {
      echo -n $"Starting $desc (zookeeper): "
      daemon --user zookeeper $ZOOKEEPER/bin/zkServer.sh start
      RETVAL=$?
      echo
      [ $RETVAL -eq 0 ] && touch /var/lock/subsys/zookeeper
      return $RETVAL
    }

    stop() {
      echo -n $"Stopping $desc (zookeeper): "
      daemon --user zookeeper $ZOOKEEPER/bin/zkServer.sh stop
      RETVAL=$?
      sleep 5
      echo
      [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/zookeeper $PIDFILE
    }

    restart() {
      stop
      start
    }

    get_pid() {
      cat "$PIDFILE"
    }

    checkstatus(){
      status -p $PIDFILE ${JAVA_HOME}/bin/java
      RETVAL=$?
    }

    condrestart(){
      [ -e /var/lock/subsys/zookeeper ] && restart || :
    }

    case "$1" in
      start)
        start
        ;;
      stop)
        stop
        ;;
      status)
        checkstatus
        ;;
      restart)
        restart
        ;;
      condrestart)
        condrestart
        ;;
      *)
        echo $"Usage: $0 {start|stop|status|restart|condrestart}"
        exit 1
    esac

    exit $RETVAL

Change permissions on the init file

    Chmod 755 /etc/init.d/zookeeper

Start/stop/restart zookeeper by using following commands 

    sudo service zookeeper start
    sudo service zookeeper stop
    sudo service zookeeper restart
    sudo service zookeeper status

Finally add it to boot menu `sudo chkconfig zookeeper on`