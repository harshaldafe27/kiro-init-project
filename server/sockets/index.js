let _io;
const setIO = (io) => {
    _io = io;
};
const getIO = () => _io;
module.exports = {
    setIO,
    getIO
};