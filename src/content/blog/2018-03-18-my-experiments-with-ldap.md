---
title: My Experiments with LDAP
pubDate: 2018-03-18
category: various
tags: ldap
author: Akshay Sinha
description: This blog is my effort to put together a list of ldap commands that can be used for most common of tasks like create a user, backup ldap, change the password etc. from command line
heroImage: ../../assets/devops.jpg
---

This blog is my effort to put together a list of ldap commands that can be used for most common of tasks like create a user, backup ldap, change the password  etc. from command line.

I hope this would especially help folks who are not exactly LDAP admins but are still required to work with active directory/ldap on and off.

<em>Please make sure to replace the {passwd} in below commands with your actual password</em>

<strong>Create a new ldap user</strong> :

1) Search for existing users

<pre>/opt/ibm/ldap/V6.3.1/bin/idsldapsearch -D cn=root -w {passwd} -s sub -b "ou=users,ou=abc,c=xyz" objectclass=*</pre>

2) Create a addusers.ldif file in /tmp directory. Here we are adding two users.
<em>/tmp/addusers.ldif</em>

<pre>dn: cn=ldapuser1,ou=users,ou=internal,o=abc,c=xyz
objectClass: top
objectClass: person
objectClass: organizationalPerson
objectClass: inetOrgPerson
objectClass: ePerson
cn: ldapuser1
sn: ldapuser1
userPassword: password1
uid: ldapuser1

dn: cn=ldapuser2,ou=users,ou=internal,o=abc,c=xyz
objectClass: top
objectClass: person
objectClass: organizationalPerson
objectClass: inetOrgPerson
objectClass: ePerson
cn: ldapuser2
sn: ldapuser2
userPassword: password2
uid: ldapuser2</pre>

3) Now execute following command :

<pre>/opt/ibm/ldap/V6.3.1/bin/idsldapadd -D cn=root -w {passwd} -i /tmp/addusers.ldif -k</pre>

4) At this point the users should be successfully added to the ldap. However if you have pwdreset policy set to true, the newly created user would have to reset their password on the first time login. This is because ldap might be enforcing an "pwdreset=true" policy on all the users.
This behavior can be suppressed by applying "pwdreset=false" policy just for the newly added users in ldap. Given below is

Execute this :

<pre>/opt/IBM/ldap/V6.3.1/bin/idsldapmodify -k -D cn=root -w {passwd}</pre>

<em>Paste this</em>

<pre>dn:cn=ldapuser1,ou=users,ou=internal,o=upr,c=us
changetype: modify
replace: PWDRESET
PWDRESET: false

dn:cn=ldapuser2,ou=users,ou=internal,o=upr,c=us
changetype: modify
replace: PWDRESET
PWDRESET: false</pre>

<em>CTRL+D out of it</em>

5) Now do a search for all the users with PWDRESET set to true. our two users should no longer be part of that list :

<pre>/opt/ibm/ldap/V6.3.1/bin/idsldapsearch -D cn=root -w {passwd} -b "ou=users,ou=internal,o=abc,c=xyz" objectclass=* PWDRESET</pre>

<strong>Changing a ldap user's password</strong>

1) Search for existing users

<pre>/opt/ibm/ldap/V6.3.1/bin/idsldapsearch -D cn=root -w {passwd} -s sub -b "ou=users,ou=abc,c=xyz" objectclass=*</pre>

2) Create a updatePasswd.ldif file in /tmp directory

<em>/tmp/updatePasswd.ldif</em>

<pre>dn:cn=ldapuser1,ou=users,ou=internal,o=abc,c=xyz
changetype: modify
replace: userPassword
userPassword: {newPassword}
</pre>

<em>Notice the {newPassword} field in the above file. Replace it with the new password.</em>

3) Now execute Following command to update the password :

<pre>/opt/ibm/ldap/V6.3.1/bin/ldapmodify -D cn=root -w {passwd} -i /tmp/updatePasswd.ldif -k</pre>

<strong>Stop/Start LDAP</strong>

1) Stop LDAP

<pre>/opt/IBM/ldap/V6.3.1/sbin/ibmslapd -I <em>{ldapInstanceName}</em> -k</pre>

For eg, in my case,

<pre>/opt/IBM/ldap/V6.3.1/sbin/ibmslapd -I isamldap -k
</pre>

2) Start LDAP

<pre>/opt/IBM/ldap/V6.3.1/sbin/ibmslapd -I <em>{ldapInstanceName}</em></pre>

For eg, in my case,

<pre>/opt/IBM/ldap/V6.3.1/sbin/ibmslapd -I isamldap
</pre>

<strong>Backup LDAP</strong>

<pre>/opt/IBM/ldap/V6.3.1/sbin/idsdbback -I <em>{ldapInstanceName}</em> -k <em>{backupDirectory}</em></pre>

For eg, in my case,

<pre>/opt/IBM/ldap/V6.3.1/sbin/idsdbback -I isamldap -k /tmp/ldapBackup</pre>

The above command takes a full backup, however if you wish to do a ldif only backup, use this :

<pre>/opt/IBM/ldap/V6.3.1/sbin/idsdb2ldif -I isamldap -o without-j.ldif</pre>