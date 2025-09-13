---
title: Integrating Slack with Rally
description: Integrating Slack with Rally
pubDate: 2018-04-27
updatedDate: 2018-04-27
category: devops
heroImage: ../../assets/devops.jpg
---

## Integrating Slack with Rally

Being a Jira admin, I am not a great fan of Rally myself. However this client that I was working with, had all its teams using Rally. They also were using Slack as the corporate team collaboration solution.

This got me thinking if there was an existing integration between slack and Rally. Not surprisingly, rally doesn't have an out of box integration with Slack and by the looks of it, it doesn't look like they are planning to work on it either. Seems like it might have something to do with them trying to push [Flowdeck](https://www.flowdock.com/) as the chatting solution on its customers. I wonder why would anyone want to migrate from Slack to Flowdeck just for this. [This](https://communities.ca.com/thread/241764680) thread is an interesting read if you are interested to know more.

Hence I ended up writing a small python script which pulls data from rally and posts them to Slack as messages. Given below is the script and the github link of the code :

[Github link](https://github.com/akshaysin/rally-to-slack)

    from datetime import datetime
    from datetime import timedelta
    from pyral import Rally
    from slacker import Slacker

    slack = Slacker('SLACKAPIKEY')

    # Send a message to #integration-testing channel

    server="rally1.rallydev.com"

    #as we are using an API key, we can leave out the username and password
    user=""
    password=""

    workspace=""
    project=""
    apikey="RALLYAPIKEY"

    #which slack channel does this post to?
    channel = ""

    #Assume this system runs (via cron) every 15 minutes.
    interval = 15 * 60

    #format of the date strings as we get them from rally
    format = "%Y-%m-%dT%H:%M:%S.%fZ"

    #create the rally service wrapper
    rally = Rally(server, user, password, apikey=apikey, workspace=workspace, project=project)
    # rally.enableLogging('mypyral.log')

    #build the query to get only the artifacts (user stories and defects) updated in the last day
    querydelta = timedelta(days=-1)
    querystartdate = datetime.utcnow() + querydelta;
    query = 'LastUpdateDate > ' + querystartdate.isoformat()
    title = "*Pulling Rally Report for {0} as of {1}*".format(project,querystartdate) + "\n";
    title = title + "==========================================================" + "\n";
    title = title + "> _This report only contains the itmes updated in last one day_" + "\n";
    title = title + "" + "\n";
    slack.chat.post_message(channel=channel, text=title, username="rallyslackbot", as_user=False)

    # List mode
    response = rally.get('HierarchicalRequirement', fetch=True, query=query, order='LastUpdateDate desc')
    for item in response:
        if item.Owner :
            postmessage= "*" + item.FormattedID + "* : " +  item.Name + "\n";
            postmessage=  postmessage + ">_Assigned to_ : " + item.Owner.UserName + "\n";
            postmessage=  postmessage + ">_Current State_ : " + item.ScheduleState + "\n";
            postmessage=  postmessage + ">_Current Testing State_ : " + item.TaskStatus + "\n";
            postmessage = postmessage + 'https://rally1.rallydev.com/#/search?keywords=' + item.FormattedID + '\n';
            postmessage=  postmessage + "" + "\n";
        else:
            postmessage= "*" + item.FormattedID + "* : " +  item.Name + "\n";
            postmessage=  postmessage + ">_Assigned to_ : " + "NA" + "\n";
            postmessage=  postmessage + ">_Current State_ : " + item.ScheduleState + "\n";
            postmessage=  postmessage + ">_Current Testing State_ : " + item.TaskStatus + "\n";
            postmessage = postmessage + 'https://rally1.rallydev.com/#/search?keywords=' + item.FormattedID + '\n';
            postmessage=  postmessage + "" + "\n";
        slack.chat.post_message(channel=channel, text=postmessage, username="rallyslackbot", as_user=False)
    slack.chat.post_message(channel=channel, text="*EOM*", username="rallyslackbot", as_user=False)

Well that's it. Have it setup in a cron on one of your boxes and watch your stories rolling into Slack.