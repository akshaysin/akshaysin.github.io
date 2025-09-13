---
title: Automated creation of components in udeploy using Python and REST
pubDate: 2018-04-09
category: devops
tags: udeploy, python, rest, components
author: Akshay Sinha
description: Automated creation of components in udeploy using Python and REST
heroImage: ../../assets/uc.jpg
---

#### Introduction

I wont say udeploy is a bad tool, but rather, Its a good tool with bad documentation. A bit about myself first. I work for a multinational client that uses uDeploy for its CI/CD needs to manage some 30-35 microservices. At first I was quite content with onboarding all the applications(read micoservices ) manually into uDeploy. However as the number of services started to go up, this proccess became quite repetetive and I started feeling the need to automate these onboardings in udeploy using REST calls.

I found that using IBM documentation around uDeploy REST methods falls well short of what you would expect of a enterprise product. One of the curious thing I found was that there are many valuable undocumented REST calls, that you can make, but the only way to find them is by scrapping them of the debugger tool. That's how I found them. There is absolutely no mention of them on IBM site. Hence I have documented here my learnings, form this exercise, in the hope that this may help some other lost soul someday.

The way my applications were setup in udeploy, automating the onboarding required automation of following tasks in the given chronological order :

* Automated creation of Components based on component templates.
* Automated assignment of tags to Components.
* Automated creation of application using component created above.

Now python being my choice of language, I opted it to make REST calls to uDeploy. You should be able to do the same using your fav language

#### Prerequisites

* Python 3.5.
* A udeploy instance where you have admin rights.

#### Connecting to udeploy via REST and Python

In order to do anything programmatically with udeploy, we would first need to connect to uDeploy. Please follow the instructions in below link to get started

[Connecting to udeploy via REST and Python](/blog/2018-04-09-connecting-to-udeploy-via-rest-and-python)

#### Create component using REST and Python

__REST Call__

    Request :
    PUT https://udeploy.host.com:port/cli/component/create

    Body :
    {
    	"name": "appname",
    	"description": "appname",
    	"templateId": "def0bc12-75a1-494d-a3a8-61de885f5106",
    	"templateVersion": "",
    	"componentType": "STANDARD",
    	"sourceConfigPlugin": "",
    	"importAutomatically": "false",
    	"useVfs": "true",
    	"defaultVersionType": "FULL",
    	"importAgentType": "inherit",
    	"inheritSystemCleanup": "true",
    	"runVersionCreationProcess": "false",
    	"properties": {},
    	"importProperties": {
    		"properties": {}
    	},
    	"teamMappings": [{
    		"teamId": "aeb05534-eddc-405d-beb8-bcfb1544c3ce"
    	}]
    }

`templateId` in above request payload refers to a component template that I an using to base this component on. Component templates are a great way to compartmentalize your component and its processes and reuse them again and again when creating new components. Also template-based components inherit the template's properties and process. For example I have `microservices component template` which I use as base when creating any new micro services component. Will talk more about it in one of the future blogs.

As I said before, uDeploy official documentation is pretty bad with examples and stuff, I usually find myself relying on chrome or mozilla's debugger tool to scrap these calls. The above request was scrapped in a similar fasion. What you do is, first try and create an component manually using udeploy's UI. Make sure you are following the calls on `network` tab on your `debugger` at the same time. As soon as you hit `save` to create component in UI, you should see a PUT call to create component in debugger with above request payload. Off course values would be different from what you see above. Copy that for later use in your python script.

__Pythonic Way__

app.py

I am assuming you followed the steps in section `Connecting to udeploy via REST and Python` to create a `connect.py`
Use following script to connect to udeploy in python and create a component :

    import connect
    import cmd
    import sys
    import json
    from pprint import pprint
    import requests
    from requests.packages.urllib3.exceptions import InsecureRequestWarning

    props = dict(line.strip().split('=') for line in open('env.properties'))

    ## uDeploy Connection Params
    url=props['udeploy.url']
    user=props['udeploy.username']
    token=props['udeploy.token']

    # Disable insecure SSL Warnings
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

    def create_ms_component(appName):
        # Create a new component based on above params
        new_component_template= {
                            "name": appName,
                            "description": appName,
                            "templateId": "def0bc12-75a1-494d-a3a8-61de885f5106",
                            "templateVersion": "",
                            "componentType": "STANDARD",
                            "sourceConfigPlugin": "",
                            "importAutomatically": "false",
                            "useVfs": "true",
                            "defaultVersionType": "FULL",
                            "importAgentType": "inherit",
                            "inheritSystemCleanup": "true",
                            "runVersionCreationProcess": "false",
                            "properties": {},
                            "importProperties": {
                            "properties": {}
                                },
                            "teamMappings": [{
                            "teamId": "aeb05534-eddc-405d-beb8-bcfb1544c3ce"
                                }]
                            }

        head = {'Content-type':'application/json',
                'Accept':'application/json'
               }

        ud=connect.udeploy(url,user,token)
        res=ud.uput('/cli/component/create',new_component_template,head)
        if res.status_code != 200:
            print ("[ERROR] Some error occured while creating the new Component {0}".format(appName))
            print (res.text)
            return False
        else:
            print ("[INFO] New Component {0} Created Successfully".format(appName))
            create_component_json_response=json.loads(res.text)
            component_id=create_component_json_response['id']
            return component_id

    if __name__ == "__main__":

    	print ("******************uDeploy Onboarding - Microservices******************")
        appName=input("Enter the name of the application : ")
        print ("[INFO] Kicking off onboarding")
        component_id=create_ms_component(appName)
        if component_id:
            print ("[Info] Component Crated successfully")
        else:
            print ("[ERROR] Some error occureed while creating components.")
    	print ("***********************************************************************")

Thats it. You just create a component in udeploy using python. Happy coding.