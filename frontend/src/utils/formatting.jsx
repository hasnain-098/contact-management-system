export const formatDisplayName = (username) => {
    if (username && username.includes('@')) {
        let namePart = username.substring(0, username.indexOf('@'));
        namePart = namePart.replace(/[._]/g, ' ');

        return namePart.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    return username || 'Guest User';
};
