/* jshint globalstrict: true */
"use strict";

/* Directives */

angular.module('talkie.directives', []).
  directive('appVersion', function (version) {
    return function (scope, elm, attrs) {
      elm.text(version);
    };
  });
