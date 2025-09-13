---
title: Installing WAS 8.5.5 FP 11 using response file
pubDate: 2018-04-09
category: various
tags: WAS, Installation
author: Akshay Sinha
description: Putting togather a hacky sort of goto cheat sheet when working with WAS 8.5.
heroImage: ../../assets/was.jpg
---

## Installing WAS 8.5.5 FP 11 using response file

#### Prerequisites

* Download Installation Manager 1.8.3000 from IBM software center
* Download WAS ND 8.5.5 for your platform from IBM software center
* Download WAS SDK 7.1 for your platform from IBM software center

Prepare empty directories

    mkdir -p /opt/IBM/media/IM1830
    mkdir -p /opt/IBM/media/WAS855ND
    mkdir -p /opt/IBM/media/WAS855NDFP11
    mkdir -p /opt/IBM/media/WASSDK71
    mkdir -p /opt/IBM/responsefiles

Install some base packages

    yum install -y zip unzip pam.i686 gtk2.i686 libXtst.i686 gtk2-engines.i686 libXm.so.4

#### Unzip Installers

I downloaded all my installers in /tmp, so that's where I will unzip my installers from

    unzip -q "/tmp/agent.installer.linux.gtk.x86_64_1.8.3000.20150606_0047.zip" -d /opt/IBM/media/IM1830
    unzip -q "/tmp/WASND_v8.5.5_1of3.zip" -d /opt/IBM/media/WAS855ND
    unzip -q "/tmp/WASND_v8.5.5_2of3.zip" -d /opt/IBM/media/WAS855ND
    unzip -q "/tmp/WASND_v8.5.5_3of3.zip" -d /opt/IBM/media/WAS855ND

    unzip -q "/tmp/8.5.5-WS-WAS-FP011-part1.zip" -d /opt/IBM/media/WAS855NDFP11
    unzip -q "/tmp/8.5.5-WS-WAS-FP011-part2.zip" -d /opt/IBM/media/WAS855NDFP11
    unzip -q "/tmp/8.5.5-WS-WAS-FP011-part3.zip" -d /opt/IBM/media/WAS855NDFP11

    unzip -q "/tmp/7.1.3.30-WS-IBMWASJAVA-part1.zip" -d /opt/IBM/media/WASSDK71
    unzip -q "/tmp/7.1.3.30-WS-IBMWASJAVA-part2.zip" -d /opt/IBM/media/WASSDK71

#### Response Files

Create following two response files in `/opt/IBM/responsefiles/` folder :

IM1830_install_01.res

      <?xml version='1.0' encoding='UTF-8'?>
      <agent-input>
        <server>
          <repository location='/opt/IBM/media/IM1830'/>
        </server>
        <profile id='IBM Installation Manager' installLocation='/opt/IBM/InstallationManager/eclipse' kind='self'>
          <data key='cic.selector.nl' value='hr,zh,tr,pt_BR,no,hu,th,de,fi,zh_TW,fr,sv,sl,sk,da,it,iw,ko,ar,zh_HK,cs,el,pl,en,ru,es,nl,ja'/>
          <data key='cic.selector.arch' value='x86_64'/>
        </profile>
        <install>
          <!-- IBM® Installation Manager 1.8.3 -->
          <offering profile='IBM Installation Manager' id='com.ibm.cic.agent' version='1.8.3000.20150606_0047' features='agent_core,agent_jre,agent_web'/>
        </install>
      </agent-input>

WAS8559_sdk71_install_01.res

      <?xml version='1.0' encoding='UTF-8'?>
      <agent-input>
        <variables>
          <variable name='sharedLocation' value='/opt/IBM/IMShared'/>
        </variables>
        <server>
          <repository location='/opt/IBM/media/WAS855ND'/>
          <repository location='/opt/IBM/media/WAS855NDFP11'/>
          <repository location='/opt/IBM/media/WASSDK71'/>
        </server>
        <profile id='IBM WebSphere Application Server V8.5' installLocation='/opt/IBM/WebSphere/AppServer'>
          <data key='eclipseLocation' value='/opt/IBM/WebSphere/AppServer'/>
          <data key='user.import.profile' value='false'/>
          <data key='cic.selector.os' value='linux'/>
          <data key='cic.selector.arch' value='x86'/>
          <data key='cic.selector.ws' value='gtk'/>
          <data key='cic.selector.nl' value='en'/>
          <data key='user.wasjava' value='java8'/>
        </profile>
        <install modify='false'>
          <!-- IBM WebSphere Application Server Network Deployment 8.5.5.11 -->
          <offering profile='IBM WebSphere Application Server V8.5' id='com.ibm.websphere.ND.v85' version='8.5.5011.20161206_1434' features='core.feature,ejbdeploy,thinclient,embeddablecontainer,com.ibm.sdk.6_64bit' installFixes='none'/>
          <!-- IBM WebSphere SDK Java Technology Edition (Optional) 7.1.3.30 -->
          <offering profile='IBM WebSphere Application Server V8.5' id='com.ibm.websphere.IBMJAVA.v71' version='7.1.3030.20160224_1952' features='com.ibm.sdk.7.1' installFixes='none'/>
        </install>
        <preference name='com.ibm.cic.common.core.preferences.eclipseCache' value='${sharedLocation}'/>
        <preference name='com.ibm.cic.common.core.preferences.connectTimeout' value='30'/>
        <preference name='com.ibm.cic.common.core.preferences.readTimeout' value='45'/>
        <preference name='com.ibm.cic.common.core.preferences.downloadAutoRetryCount' value='0'/>
        <preference name='offering.service.repositories.areUsed' value='true'/>
        <preference name='com.ibm.cic.common.core.preferences.ssl.nonsecureMode' value='false'/>
        <preference name='com.ibm.cic.common.core.preferences.http.disablePreemptiveAuthentication' value='false'/>
        <preference name='http.ntlm.auth.kind' value='NTLM'/>
        <preference name='http.ntlm.auth.enableIntegrated.win32' value='true'/>
        <preference name='com.ibm.cic.common.core.preferences.preserveDownloadedArtifacts' value='true'/>
        <preference name='com.ibm.cic.common.core.preferences.keepFetchedFiles' value='false'/>
        <preference name='PassportAdvantageIsEnabled' value='false'/>
        <preference name='com.ibm.cic.common.core.preferences.searchForUpdates' value='false'/>
        <preference name='com.ibm.cic.agent.ui.displayInternalVersion' value='false'/>
        <preference name='com.ibm.cic.common.sharedUI.showErrorLog' value='true'/>
        <preference name='com.ibm.cic.common.sharedUI.showWarningLog' value='true'/>
        <preference name='com.ibm.cic.common.sharedUI.showNoteLog' value='true'/>
      </agent-input>

#### Install Installation Manager

Execute following commands

    cd /opt/IBM/media/IM1830/
    ./userinstc -record /opt/IBM/responsefiles/IM1830_install_01.res -installationDirectory /opt/IBM/InstallationManager -acceptLicense -sP


#### Install WAS

    cd /opt/IBM/InstallationManager/eclipse/tools
    ./imcl input /opt/IBM/responsefiles/WAS8559_sdk71_UO_install_01.res -log /tmp/WAS8559_install_log.xml -acceptLicense

#### Verify WAS Install

    cd /opt/IBM/WebSphere/AppServer/bin
    ./versionInfo.sh

If you see an output similar to something as below, congrats, you have successfully installed WAS

    WVER0010I: Copyright (c) IBM Corporation 2002, 2012; All rights reserved.
    WVER0012I: VersionInfo reporter version 1.15.1.48, dated 2/8/12

    --------------------------------------------------------------------------------
    IBM WebSphere Product Installation Status Report
    --------------------------------------------------------------------------------

    Report at date and time March 15, 2018 2:30:20 PM EDT

    Installation
    --------------------------------------------------------------------------------
    Product Directory        /opt/IBM/WebSphere/AppServer
    Version Directory        /opt/IBM/WebSphere/AppServer/properties/version
    DTD Directory            /opt/IBM/WebSphere/AppServer/properties/version/dtd
    Log Directory            /home/unica/var/ibm/InstallationManager/logs

    Product List
    --------------------------------------------------------------------------------
    ND                       installed
    IBMJAVA71                installed

    Installed Product
    --------------------------------------------------------------------------------
    Name                  IBM WebSphere Application Server Network Deployment
    Version               8.5.5.11
    ID                    ND
    Build Level           cf111649.01
    Build Date            12/6/16
    Package               com.ibm.websphere.ND.v85_8.5.5011.20161206_1434
    Architecture          x86-64 (64 bit)
    Installed Features    IBM 64-bit WebSphere SDK for Java
                          WebSphere Application Server Full Profile
                          EJBDeploy tool for pre-EJB 3.0 modules
                          Embeddable EJB container
                          Stand-alone thin clients and resource adapters

    Installed Product
    --------------------------------------------------------------------------------
    Name                  IBM WebSphere SDK Java Technology Edition (Optional)
    Version               7.1.3.30
    ID                    IBMJAVA71
    Build Level           cf091608.04
    Build Date            2/24/16
    Package               com.ibm.websphere.IBMJAVA.v71_7.1.3030.20160224_1952
    Architecture          x86-64 (64 bit)
    Installed Features    IBM WebSphere SDK for Java Technology Edition Version 7.1

    --------------------------------------------------------------------------------
    End Installation Status Report
    --------------------------------------------------------------------------------