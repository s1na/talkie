/* jshint globalstrict: true */
"use strict";

/* Filters */

angular.module('talkie.filters', []).
  filter('trim', function () {
    return function (input) {
      return input.replace(/^\s+|\s+$/g, '');
    };
  });

