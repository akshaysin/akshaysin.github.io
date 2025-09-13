---
title: Enabling Developer tools and set Chrome as default browser in Windows
pubDate: 2018-03-18
category: various
tags: chrome, devtools
author: Akshay Sinha
description: Enabling Developer tools and set Chrome as default browser in Windows
heroImage: ../../assets/devops.jpg
---

It used to bug me that every time I opened chrome, Developer tools was disabled by default and I had to edit the registry to get it enabled. To gratify my lazy bones, I put together a short power shell script to update the registry for me. Please feel free to share it.

        if ( Get-ItemProperty HKLM:\SOFTWARE\Policies\Google\Chrome) {   
                Set-ItemProperty -Path HKLM:\SOFTWARE\Policies\Google\Chrome -Name DeveloperToolsDisabled -Value 0  
                write-host "Devtools enabled successfully" -foregroundcolor green  
                Set-ItemProperty -Path HKLM:\SOFTWARE\Policies\Google\Chrome -Name DefaultBrowserSettingEnabled -Value 0  
                write-host "Chrome set as default browser" -foregroundcolor green
        }
        else {  
                write-host "HKLM:\SOFTWARE\Policies\Google\Chrome path not found !!" -foregroundcolor red
        }

Just save it somewhere on your box with an extension of .ps1 and execute it when needed as given below :

        powershell -file myfile.ps1

Note, If using powershell for the first time on your box, you might get an error like :

        .... cannot be loaded because the execution of scripts is disabled on this system.

To bypass this, as an Administrator, you can set the execution policy by typing this into your PowerShell window:

        Set-ExecutionPolicy RemoteSigned

However make sure to understand the full implications of that [setting](https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-powershell-1.0/ee176961(v=technet.10)) before executing the above command