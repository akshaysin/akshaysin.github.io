---
title: Connecting to udeploy via REST and Python
pubDate: 2018-04-18
category: devops
tags: udeploy, python, rest
author: Akshay Sinha
description: Connecting to udeploy via REST and Python
heroImage: ../../assets/uc.jpg
---

#### Connecting to udeploy via REST and Python

In order to do anything programmatically with udeploy, we would first need to connect to uDeploy. The very first thing that you might have to do is to get yourself a token in uDeploy. IBM official documentation should suffice for this. Please follow the steps given on this page to generate your self a auth token in udeploy

https://www.ibm.com/support/knowledgecenter/en/SS8NMD_6.1.2/com.ibm.ucbuild.doc/topics/integrations_udeploy.html

Once you have the token, create a `connect.py` in your workspace. Following program instantiates a udeploy object to interface with udeploy for REST calls.

connect.py

      import json
      import requests
      import base64
      from requests.auth import HTTPBasicAuth
      from requests.packages.urllib3.exceptions import InsecureRequestWarning

      # Disable insecure SSL Warnings
      requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

      class udeploy(object):

      def __init__(self, url, user, token):
        self.url=url
        self.user=user
        self.token=token

      # Method to do a get to udeploy
      def uget(self, uri):
        furl = self.url + uri
        res=requests.get(furl, auth=(self.user, self.token), verify=False)
        if res.status_code != 200:
            print ("Error, Status code not 200")
        else:
            return res
      # Method to do a post to udeploy
      def upost(self, uri, pl, hd):
        payload = pl
        payld = json.dumps(payload)
        furl = self.url + uri
        res=requests.post(furl,auth=(self.user,self.token),headers=hd,data=payld,verify=False)
        if res.status_code != 200:
            print ("Error, Status code not 200")
            print (res.status_code)
            print (res.text)
        else:
            return res

      # Method to do a put to udeploy
      def uput(self, uri, pl, hd):
        payload = pl
        payld = json.dumps(payload)
        furl = self.url + uri
        res=requests.put(furl,auth=(self.user,self.token),headers=hd,data=payld,verify=False)
        return res

      # Method to do a put to udeploy, but without payload (because some udeploy rest calls make a put w/o any payload.. I know)
      def uput_nopl(self, uri, hd):
        furl = self.url + uri
        res=requests.put(furl,auth=(self.user,self.token),headers=hd,verify=False)
        return res

Also at this time, lets create a properties file to store the udeploy connection parameters `env.properties`

      udeploy.url=https://udeployhost:8443
      udeploy.username=PasswordIsAuthToken
      udeploy.password=admin
      udeploy.token=e6666a35-616b-4120-889e-b5fe26555b39

We shall use it in our subsequent scripts