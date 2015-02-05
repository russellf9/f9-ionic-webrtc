(function() {
    'use strict';

    /**
     * A Controller for the games instructions
     */
    angular.module('magicsquares').controller('Instructions', ['Model', 'Text', function(Model, Text) {
        this.instructions = Text.instructions + Model.magicNumber() + '.';
    }]);
}());

