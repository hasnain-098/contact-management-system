export const formatDisplayName = (username) => {
    if (username && typeof username === 'string'  && username.includes('@')) {
        let namePart = username.substring(0, username.indexOf('@'));
        const cleanedNamePart = namePart
            .replaceAll('.', ' ')
            .replaceAll('_', ' ');

        return cleanedNamePart.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    return username || 'Guest User';
};