/* jshint globalstrict: true */
"use strict";

/* Directives */

angular.module('talkie.directives', []).
  directive('appVersion', function (version) {
    return function (scope, elm, attrs) {
      elm.text(version);
    };
  }).
  directive('retPressed', function () {
    return {
      restrict: 'A',
      link: function(scope, elem, attr) {
        elem.bind('keypress', function (e) {
          if (e.keyCode == 13) {
            if (!e.shiftKey) {
              e.preventDefault();
              scope.$apply(function (s) {
                s.$eval(attr.retPressed);
              });
            }
          }
        })
      }};
  });
