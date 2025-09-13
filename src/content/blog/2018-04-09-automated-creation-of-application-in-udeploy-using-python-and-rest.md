---
title: Automated creation of application in udeploy using Python and REST
pubDate: 2018-04-09
category: devops
tags: udeploy, python, rest, application
author: Akshay Sinha
description: Automated creation of Applications in udeploy using Python and REST
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

Before we create a application, we will need to know, how to create a component. Please refer to following link for details on That

[Create component using REST and Python](/blog/2018-04-09-create-component-using-rest-and-python)

#### Create application using REST and Python

I have found that if you take some time to think out and establish your component and application templates in advance, it actually saves a lot of headaches in future. For example lets say a need arises in future to update one of the component/application processes. Now if you are in a similar role as me and maintain ~35 micro services, you would just need to fix the required process in the template and it will automatically be fixed in all 35 micro services. That's because all my micro services are based on same component and application template. I am a big beleiver of the fact that if parametrized enough, you can always come up with one generalized template to be used by all components of that type.

__REST Call__

    Request :
    PUT https://udeploy.host.com:port/rest/deploy/application/createFromWizard

    Body :
    {
                                "application": {
                                "name": "appName",
                                "description": "",
                                "templateId": "a6a751e4-45a6-11e8-842f-0ed5f89f718b",
                                "templateVersion": "",
                                "notificationSchemeId": "a6a75c8e-45a6-11e8-842f-0ed5f89f718b",
                                "enforceCompleteSnapshots": "False",
                                "teamMappings": [{
                                    "teamId": "a6a75e00-45a6-11e8-842f-0ed5f89f718b"
                                }]
                            },
                            "components": {
                                "existingComponents": ["component_id"],
                                "newComponents": []
                            },
                            "environments": [{
                                "name": "DEV",
                                "templateId": "a6a75f36-45a6-11e8-842f-0ed5f89f718b",
                                "templateVersion": 3,
                                "description": "",
                                "requireApprovals": False,
                                "noSelfApprovals": False,
                                "exemptProcesses": "",
                                "lockSnapshots": False,
                                "color": "#008ABF",
                                "teamMappings": [{
                                    "resourceRoleId": "a6a76184-45a6-11e8-842f-0ed5f89f718b",
                                    "teamId": "a6a75e00-45a6-11e8-842f-0ed5f89f718b"
                                }],
                                "resources": []
                            }]
    }

`templateId` in above request payload refers to a application template that I an using to base this application on. Application templates are a great way to compartmentalize your Application and its processes and reuse them again and again when creating new Application. Also template-based Application inherit the template's properties and process. For example I have `microservices Application template` which I use as base when creating any new micro services Application. Will talk more about it in one of the future blogs.

Also notice that we are also creating envs too here along with application. Although in the above exaple, I only create one env `DEV` for demonstration purposes. However in real life, you would want to create all envs at the same time. This works best if you are also open to use eniornment and resource templates. Because in that case you will have the opportunity to define one resource template for each env and marry resource templates to environments and as soon as a application is created, voila, you have all envs and each env has right resources tied to it.

As I said before, uDeploy official documentation is pretty bad with examples and stuff, I usually find myself relying on chrome or mozilla's debugger tool to scrap these calls. The above request was scrapped in a similar fashion. What you do is, first try and create an Application manually using udeploy's UI `create application wizard`. Make sure you are following the calls on `network` tab on your `debugger` at the same time. As soon as you hit `save` to create Application in UI, you should see a PUT call to create Application in debugger with above request payload. Off course values would be different from what you see above. Copy that off for later use in your python script.

__Pythonic Way__

I am assuming you followed the steps in section `Connecting to udeploy via REST and Python` to create a `connect.py` and an `env.properties`
Use following script to connect to udeploy in python and create a component :

app.py

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

    def create_ms_application(appName,component_id):
        new_application_template={
        									"application": {
        									"name": "{0}".format(appName),
        									"description": "",
        									"templateId": "a6a751e4-45a6-11e8-842f-0ed5f89f718b",
        									"templateVersion": "",
        									"notificationSchemeId": "a6a75c8e-45a6-11e8-842f-0ed5f89f718b",
        									"enforceCompleteSnapshots": "False",
        									"teamMappings": [{
        										"teamId": "a6a75e00-45a6-11e8-842f-0ed5f89f718b"
        									}]
        								},
        								"components": {
        									"existingComponents": ["{0}".format(component_id)],
        									"newComponents": []
        								},
        								"environments": [{
        									"name": "DEV",
        									"templateId": "a6a75f36-45a6-11e8-842f-0ed5f89f718b",
        									"templateVersion": 3,
        									"description": "",
        									"requireApprovals": False,
        									"noSelfApprovals": False,
        									"exemptProcesses": "",
        									"lockSnapshots": False,
        									"color": "#008ABF",
        									"teamMappings": [{
        										"resourceRoleId": "a6a76184-45a6-11e8-842f-0ed5f89f718b",
        										"teamId": "a6a75e00-45a6-11e8-842f-0ed5f89f718b"
        									}],
        									"resources": []
        								}]
        							}
        head = {
                    'Content-type':'application/json',
                    'Accept':'application/json'
                }
        ud=connect.udeploy(url,user,token)
        res=ud.uput('/rest/deploy/application/createFromWizard',new_application_template,head)
        if res.status_code != 200:
            print ("[ERROR] Some error occured while creating the new Application {0}".format(appName))
            print (res.text)
        else:
            print ("[INFO] New Application {0} Created Successfully".format(appName))

    if __name__ == "__main__":

    	print ("******************uDeploy Onboarding - Microservices******************")
        appName=input("Enter the name of the application : ")
        print ("[INFO] Kicking off onboarding")
        component_id=create_ms_component(appName)
        if component_id:
            print ("[Info] Component Crated successfully")
            create_ms_application(appName,component_id)
        else:
            print ("[ERROR] Some error occureed while creating components.")
    	print ("***********************************************************************")

Thats it. You just created a Application in udeploy and added component to it using python. Happy coding.