[![Haibun Axe unit tests](https://github.com/withhaibun/haibun-web-accessibility-axe/actions/workflows/test.yml/badge.svg)](https://github.com/withhaibun/haibun-web-accessibility-axe/actions/workflows/test.yml)

# haibun-web-accessibility-axe

Haibun Web Accessibility Axe is a module that incorporates Haibun's integration and testing with that of Axe, an accessibility test engine. 

## Installation

Normally, libraries from this repository will be included in a project like any other, or used via the cli, for example, using `npx @haibun/cli`. For more information you can visit `Haibun` at `https://github.com/withhaibun/haibun`

### Axe 

Axe serves as an accessibility testing ruleset developed by Deque Systems, and follows the interational standards set under WCAG. 

## Developing modules and Haibun core together

To develop your own separate module while developing Haibun modules, use:

`npm link @haibun/core`

and any other modules you may need.
 