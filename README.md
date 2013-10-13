# Tinymesh Cloud - AngularJS

Library for working with Tinymesh Cloud using the AngularJS framework.

The application depends on code from AngularJS, CryptoJS and UnderscoreJS.

## Building

### Prerequisites dev env

The following dependencies are necessary: `angularjs`, `cryptojs`. Due
to the fact you will most likely want to include some other
AngularJS dependencies we opted not to include it. The NPM port was
not finished so we chose to include that as an external dependency
as well.

```bash
# Fetch crypto js
mkdir vendor/crypto-js; cd vendor/crypto-js
wget https://crypto-js.googlecode.com/files/CryptoJS%20v3.1.2.zip
unzip CryptoJS\ v3.1.2.zip
cd -
# fetch angular
wget http://code.angularjs.org/1.2.0-rc.2/angular-1.2.0-rc.2.zip
unzip angular-1.2.0-rc.2.zip
rm !$
mv angular-1.2.0-rc.2 vendor/angular
```

### Dev build

```bash
# run grunt which will jslint and do it's magic
grunt build
```

## Notes on cryptography

User authentication requires an implementation of SHA256 for
transferring password during authentication as well as HMAC-SHA256
signing of requests; this is delivered through CryptoJS. In regards of
using the AES encryption of the API this will be implemented in the
future, although for applications with high security requirements we
recommend alternative approaches (but that you already knew).

## Contributing
Tinymesh encourages contributions to the AngularJS library from the community.
All changes are managed by git[1], and changes should be made using
the following guidelines:

 - Create a fork of the repository [2]
 - Create a new branch. The name should contain your username and some keywords
   describing your changes, for example: `lafka-update-message-view`
 - Push your branch to git and create a pull request [3]
 - A Tinymesh engineer will review your changes and possibly merge them.

As a second option you can send patches to `code <at> tiny-mesh.com`.

[1] GIT is a version control system, to learn git checkout http://www.git-scm.com/book
[2] https://help.github.com/articles/fork-a-repo
[3] https://help.github.com/articles/using-pull-requests

## Licensing

The code for the Workbench application is released under a 2-clause
BSD license. This license can be found in the `./LICENSE` file.

Additionally the application dependencies uses the following licenses:

+ AngularJS:    MIT license - https://github.com/angular/angular.js/blob/master/LICENSE
+ UnderscoreJS: MIT license - https://github.com/jashkenas/underscore/blob/master/LICENSE
+ CryptoJS:     New BSD License - http://opensource.org/licenses/BSD-3-Clause
+ JSON3:        MIT License - https://github.com/bestiejs/json3/blob/gh-pages/LICENSE
