module.exports = {
    name: 'contract',
    transforms: function(doc, tag, value) {
        var content = value.replace(/^\s+|\s+$/g, '')
        if (content.toLowerCase() !== 'true' && content.toLowerCase() !== 'false') {
            throw new Error('Invalid tag, contract.  Valid values are true or false');
        }

        if(content.toLowerCase() === 'false') {
            return true;
        } else {
            return false;
        }
    }
};