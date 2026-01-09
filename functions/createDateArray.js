module.exports = (fromDate, toDate) => {
    const dates = [];

    Date.prototype.addDays = function(days) {
        let date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }

    let startDate = new Date(fromDate);
    let date = '00';
    for (let i = 0; date !== toDate ; i++){
        const now = startDate.addDays(i);
        let month = (now.getMonth() + 1);
        let day = now.getDate();
        if (month < 10)
            month = "0" + month;
        if (day < 10)
            day = "0" + day;
        date = now.getFullYear() + '-' + month + '-' + day;
        dates.push(date);
    }
    return dates;
}
