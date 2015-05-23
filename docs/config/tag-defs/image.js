module.exports = {
    name: 'image',
    multi: true,
    transforms: function(doc, tag, value) {
        var content = value.replace(/^\s+|\s+$/g, '');
        return content;
    }
};