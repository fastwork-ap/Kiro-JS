// Nintex Forms - Custom JavaScript
// Add this in Form Settings > Custom JavaScript
//
// Setup:
//   Dropdown control  -> CSS class: "state-dropdown"
//   Single line text  -> CSS class: "color-textbox"

NWF$(document).ready(function () {
    var $dropdown = NWF$('.state-dropdown').find('select');
    var $textbox  = NWF$('.color-textbox').find('input');

    function setColorFromState() {
        var selected = $dropdown.val();

        // Map dropdown choices to text values
        var colorMap = {
            'Georgia': 'Red'
            // add more mappings here, e.g. 'Florida': 'Blue'
        };

        // Set the text field, or clear it if no match
        $textbox.val(colorMap[selected] || '');

        // Fire change so Nintex picks up the new value for saving/validation
        $textbox.trigger('change');
    }

    // Run when the dropdown changes and once on load
    $dropdown.on('change', setColorFromState);
    setColorFromState();
});
