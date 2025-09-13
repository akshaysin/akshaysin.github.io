---
title: Kafka Commands Guide
pubDate: 2018-06-09
category: kafka
tags: kafka, zookeeper, installation
author: Akshay Sinha
description: A goto guide for Kafka day to day commands.
heroImage: ../../assets/devops.jpg
---

## A goto guide for Kafka day to day administration commands.

This is a short goto guide for any kafka administrators with some of the most useful commands that I find myself working with.

#### The "bin" directory

I am a big fan of using hdf version of kafka even when kafka is the only thing I am looking for from that suite. The main reason is ambari. Using ambari, the installation and adminstartion of the kafka cluster becomes a breeze. I have written a seperate blog on how to get kafka installed using hdf [here](https://akshaysin.github.io/hdf-kafka.html#.Wxwn9IpKhPY).

So if you did too are runing a hdf instace for kafka, your kafka bin directory would usually be in below listed directory on one of the kafka nodes

	/usr/hdf/3.0.2.0-76/kafka/

`3.0.2.0-76` being the version of hdf you are using. cd into that dir.

#### Create a topic

	bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 3 --partitions 1 --topic TOPIC_NAME

#### Describe a Topic

	bin/kafka-topics.sh --describe --zookeeper localhost:2181
	bin/kafka-topics.sh --zookeeper localhost:2181 --describe --topics-with-overrides

#### Running a commandline Producer

	bin/kafka-console-producer.sh --topic TOPIC_NAME --broker-list KFK_NODE01:6667,KFK_NODE02:6667,KFK_NODE03:6667

#### Running a commandline Consumer

	bin/kafka-console-consumer.sh --from-beginning --topic TOPIC_NAME --bootstrap-server KFK_NODE01:6667,KFK_NODE02:6667,KFK_NODE03:6667

#### Update retention period on an topic

	bin/kafka-topics.sh --zookeeper localhost:2181 --alter --topic TOPIC_NAME --config retention.ms=1000

Note that this also works as a neat little trick if you wanna purge a topic's data. Just set the retention to a mower value and once the data is gone, reset it back to desired value.

For example, If you need to delete all messages in topic, you can exploit the retention times. First set the retention time to something very low (1000 ms), wait a few seconds, then revert the retention times back to the previous value.

Note: The default retention time is 24 hours (86400000 millis).

#### Deleting a topic

First add following line to server.properties in `conf` folder. Its right along side `bin`

	delete.topic.enable=true

then, restart kafka and then

	bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic TOPIC_NAME

### Security
Kafka ships with an out of box authorizer. What that means is that it gives you the ability to setup acls across topics and restrict them to the users you like. I have found client cert mutual authentication coupled with this acl approach to be very effective. Please refer to folowing two bolgs for more details :

  * [Setting up Client cert mutual authentication in a kafka hdf cluster](/blog/2018-06-09-kafka-ssl)
  * [Authorization setup in Ambari Kafka based on ACLs](/blog/2018-06-09-kafka-acls)