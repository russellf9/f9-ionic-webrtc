(function() {

    'use strict';

    //controller for drag and drop
    angular.module('magicsquares').controller('DragDrop', ['Model', function(Model) {

        var self = this;

        // the `drop` items
        this.dropTargets = Model.getDropItems();

        // the `drag` items
        this.dragItems = Model.getDragItems();

        // the `drag` items which have been `dropped`
        this.selectedItems = Model.selectedItems();

        // callbacks
        /**
         * evoked when the user begins to drag the item
         * @param event
         * @param ui
         * @param title
         */
        this.startCallback = function(event, ui, title) {
            // console.log('DragDrop::startCallback  You started dragging: ' + title.title);
            self.draggedTitle = title.title;
        };
        /**
         * evoked when the user stops to drag the item
         * @param event
         * @param ui
         */
        this.stopCallback = function(event, ui) {
            // console.log('DragDrop::stopCallback - Why did you stop dragging me?');
        };
        /**
         * evoked when the user is dragging an item
         * @param event
         * @param ui
         */
        this.dragCallback = function(event, ui) {
            // console.log('DragDrop::dragCallback - hey, look I`m flying');
        };
        /**
         * Evoked when a `drag` item has been dropped into the `drop` item
         * @param event
         * @param ui
         * @param index
         */
        this.dropCallback = function(event, ui, index) {
            var currentDragItem = Model.selectedItems()[index];
            // console.log('DragDrop::dropCallback  - hey, you dumped me :-(', currentDragItem.title);
        };
        /**
         * Evoked when a `drag` item is over `drop` item
         * Note: can be evoked when the user is dragging another drag item over this drag item!
         * @param event
         * @param ui
         * @param dropTarget
         * @param dragIndex
         */
        this.overCallback = function(event, ui, dropTarget, dragIndex) {
            // console.log('DragDrop::overCallback - Look, the drag?: ', dragIndex);
        };
        /**
         * Evoked when a `drag` item has been removed from a `drop` item
         * @param event
         * @param ui
         * @param index
         */
        this.outCallback = function(event, ui, index) {
            var currentDragItem = Model.selectedItems()[index];
            if (currentDragItem && currentDragItem.hasOwnProperty('title')) {
                // console.log('DragDrop::outCallback  - hey, good bye to: ', currentDragItem.title);
            }
        };
        /**
         * returns the total of the selected items in the selected row
         * @param value a number which represents the row
         * @returns {number}
         */
        this.getRowTotal = function(value) {
            //// console.log('getRowTotal: ',value, ' - ', Model.getRowTotal(value));
            return Model.getRowTotal(value);
        };
        /**
         * returns the total of the selected items in the selected column
         * @param value the column number
         * @returns {number}
         */
        this.getColumnTotal = function(value) {
            return Model.getColumnTotal(value);
        };
        /**
         * returns the total of the selected items in the selected diagonal
         * @param value the row number
         * @returns {number}
         */
        this.getDiagonalTotal = function(value) {
            return Model.getDiagonalTotal(value);
        };
         /* returns the total of the selected items in the selected diagonal
         * @param value
         * @returns {number}
         */
        this.getDiagonalTotalReverse = function(value) {
            var reverse = (value === 0) ? 1: 0;
            return Model.getDiagonalTotal(reverse);
        };
    }]);
}());


