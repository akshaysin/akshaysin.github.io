---
title: Authorization setup in Ambari Kafka based on ACLs
description: Authorization setup in Ambari Kafka based on ACLs
pubDate: 2018-06-09
updatedDate: 2018-06-09
category: Various
heroImage: ../../assets/devops.jpg
---

## Prerequisites

Make sure that you have client cert authentication enabled in kafka cluster by following the instructions in my previous blog

[Setting up Client cert mutual authentication in a kafka hdf cluster]({filename}/kafka/2018_06_09_kafka_ssl.md)

## ACL based Authorization in Kafka

### Introduction

Kafka ACLs are defined in the general format of "Principal P is [Allowed/Denied] Operation O From Host H On Resource R".
Kafka resources that can be protected with ACLS are:
    * Topic
    * Consumer group
    * Cluster

Add the below properties in custom-kafka-broker section to enable authorization with SSL  

    authorizer.class.name=kafka.security.auth.SimpleAclAuthorizer
    super.users=User:CN=_kafkanode01_,OU=me,O=me,L=or,ST=fl,C=us;User:CN=_kafkanode02_,OU=me,O=me,L=or,ST=fl,C=us;User:CN=_kafkanode03_,OU=me,O=me,L=or,ST=fl,C=us;User:kafka
    allow.everyone.if.no.acl.found=true
    security.inter.broker.protocol=SSL


### How to add ACLs for a new SSL user ?

Create a topic

    bin/kafka-topics.sh --create --zookeeper _kafkanode01_:2181 --replication-factor 3 --partitions 1 --topic ssltest

List current ACL

    bin/kafka-acls.sh --authorizer-properties zookeeper.connect=localhost:2181 --list --topic ssltest

Add producer permission for SSL user (CN=_TOPICNAME_, OU=me, O=me, L=or, ST=fl, C=us)

    bin/kafka-acls.sh --authorizer-properties zookeeper.connect=localhost:2181 --add --allow-principal "User:CN=_TOPICNAME_,OU=me,O=me,L=or,ST=fl,C=us" --topic ssltest --producer

Add consumer permission for SSL user (CN=_TOPICNAME_, OU=me, O=me, L=or, ST=fl, C=us)

    bin/kafka-acls.sh --authorizer-properties zookeeper.connect=localhost:2181 --add --allow-principal "User:CN=_TOPICNAME_,OU=me,O=me,L=or,ST=fl,C=us" --topic ssltest --consumer --group *

List current ACL

    bin/kafka-acls.sh --authorizer-properties zookeeper.connect=localhost:2181 --list --topic ssltest

### Debugging

As it goes, security related changes never usually work on first attempt. Hence to debug, it might help to enable authorization DEBUG logs by adding following under kafka lo4j properties

    log4j.logger.kafka.authorizer.logger=DEBUG, authorizerAppender

Keep in mind that authorizer logs tend to fill disk space quickly, so make to sure to turn them off after use

### Points to note

#### Using SSL and PLAINTEXT at the same time

If you want to keep on using both SSL and PLAINTEXT until all your clients are transitioned to SSL, make sure to add following entry to super.users

    User:ANONYMOUS

This way your clients can continue to connect to Kafka brokers using PLAINTEXT.

#### Disabling SSL

When its time to switch to SSL completely, just remove the following two entries  
    * `PLAINTEXT://localhost:6667,` from `listeners`  
    * and `User:ANONYMOUS` from `super.users`