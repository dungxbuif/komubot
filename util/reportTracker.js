const trackerSpentTimeData = require('../models/trackerSpentTimeData');
const userData = require('../models/userData');
const { MessageEmbed } = require('discord.js');

const HOURS_IN_SECONDS = 60 * 60;

const messHelp =
  '```' + 'Người này hiện không sử dụng tracker trong tuần' + '```';
async function reportTracker(message, args, client) {
  let hours = Math.floor(3600 * 7);
  if (args[1] === 'daily') {
    let setDateToday = new Date();
    setDateToday.setDate(setDateToday.getDate() - 1);
    const date = new Date(setDateToday).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (args[2]) {
      const tracker = await trackerSpentTimeData.find({
        email: args[2],
        date: date,
      });
      if (tracker.length === 0) return message.channel.send(messHelp);

      let userTracker = [];
      await Promise.all(
        tracker.map(async (item) => {
          const findUser = await userData
            .find({
              email: item.email,
              deactive: { $ne: true },
            })
            .select('id email -_id');

          findUser.map((user) => {
            if (user.email === item.email)
              userTracker.push({
                id: user.id,
                email: user.email,
                spent_time: item.spent_time / HOURS_IN_SECONDS,
              });
          });
        })
      );

      userTracker.sort(
        (a, b) => parseFloat(a.spent_time) - parseFloat(b.spent_time)
      );

      let mess;
      if (!userTracker) {
        return;
      } else if (Array.isArray(userTracker) && userTracker.length === 0) {
        mess = '```' + 'Không có bản ghi nào cho ngày hôm qua' + '```';
        return message.reply(mess).catch(console.error);
      } else {
        for (let i = 0; i <= Math.ceil(userTracker.length / 50); i += 1) {
          if (userTracker.slice(i * 50, (i + 1) * 50).length === 0) break;
          mess = userTracker
            .slice(i * 50, (i + 1) * 50)
            .map((check) => `${check.email} ${check.spent_time.toFixed(2)} giờ`)
            .join('\n');
          const Embed = new MessageEmbed()
            .setTitle('Thời gian sử dụng tracker của bạn trong ngày hôm qua')
            .setColor('RED')
            .setDescription(`${mess}`);
          await message.reply({ embeds: [Embed] }).catch(console.error);
        }
      }
    } else {
      const tracker = await trackerSpentTimeData.aggregate([
        {
          $match: {
            spent_time: { $lt: hours },
            date: date,
          },
        },
        {
          $group: {
            _id: '$email',
            spent_time: { $last: '$spent_time' },
          },
        },
        {
          $project: {
            _id: 0,
            email: '$_id',
            spent_time: 1,
          },
        },
      ]);

      let userTracker = [];
      await Promise.all(
        tracker.map(async (item) => {
          const findUser = await userData
            .find({
              email: item.email,
              deactive: { $ne: true },
            })
            .select('id email -_id');

          findUser.map((user) => {
            if (user.email === item.email)
              userTracker.push({
                id: user.id,
                email: user.email,
                spent_time: item.spent_time / HOURS_IN_SECONDS,
              });
          });
        })
      );

      userTracker.sort(
        (a, b) => parseFloat(a.spent_time) - parseFloat(b.spent_time)
      );

      let mess;
      if (!userTracker) {
        return;
      } else if (Array.isArray(userTracker) && userTracker.length === 0) {
        mess = '```' + 'Không có ai vi phạm trong ngày' + '```';
        return message.reply(mess).catch(console.error);
      } else {
        for (let i = 0; i <= Math.ceil(userTracker.length / 50); i += 1) {
          if (userTracker.slice(i * 50, (i + 1) * 50).length === 0) break;
          mess = userTracker
            .slice(i * 50, (i + 1) * 50)
            .map((check) => `${check.email} ${check.spent_time.toFixed(2)} giờ`)
            .join('\n');
          const Embed = new MessageEmbed()
            .setTitle(
              'Những người không bật đủ thời gian tracker trong ngày hôm qua'
            )
            .setColor('RED')
            .setDescription(`${mess}`);
          await message.reply({ embeds: [Embed] }).catch(console.error);
        }
      }
    }
  } else if (args[1] === 'weekly') {
    let dateMondayToSFriday = [];
    const current = new Date();
    const first = current.getDate() - current.getDay();
    const firstday = new Date(current.setDate(first + 1)).toString();
    for (let i = 1; i < 6; i++) {
      const next = new Date(current.getTime());
      next.setDate(first + i);
      const date = new Date(next).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      dateMondayToSFriday.push(date);
    }
    if (args[2]) {
      const tracker = await trackerSpentTimeData.find({
        email: args[2],
        date: { $in: dateMondayToSFriday },
      });
      if (tracker.length === 0) return message.channel.send(messHelp);

      let userTracker = [];
      await Promise.all(
        tracker.map(async (item) => {
          const findUser = await userData
            .find({
              email: item.email,
              deactive: { $ne: true },
            })
            .select('id email -_id');

          findUser.map((user) => {
            if (user.email === item.email)
              userTracker.push({
                id: user.id,
                email: user.email,
                spent_time: item.spent_time / HOURS_IN_SECONDS,
                date: item.date,
              });
          });
        })
      );

      userTracker.sort(
        (a, b) => parseFloat(a.spent_time) - parseFloat(b.spent_time)
      );

      let mess;
      if (!userTracker) {
        return;
      } else if (Array.isArray(userTracker) && userTracker.length === 0) {
        mess = '```' + 'Không có bản ghi nào cho tuần qua' + '```';
        return message.reply(mess).catch(console.error);
      } else {
        for (let i = 0; i <= Math.ceil(userTracker.length / 50); i += 1) {
          if (userTracker.slice(i * 50, (i + 1) * 50).length === 0) break;
          dateMondayToSFriday.map((dateWeekly) => {
            let dataTracker = userTracker;
            mess = dataTracker
              .slice(i * 50, (i + 1) * 50)
              .filter((item) => item.date === dateWeekly)
              .map(
                (check) => `${check.email} ${check.spent_time.toFixed(2)} giờ`
              )
              .join('\n');
            const day = dateWeekly.slice(0, 2);
            const month = dateWeekly.slice(3, 5);
            const year = dateWeekly.slice(6);

            const fomat = `${month}/${day}/${year}`;
            const Embed = new MessageEmbed()
              .setTitle(`Thời gian sử dụng tracker của bạn trong ngày ${fomat}`)
              .setColor('RED')
              .setDescription(`${mess}`);
            return message.reply({ embeds: [Embed] }).catch(console.error);
          });
        }
      }
    } else {
      const tracker = await trackerSpentTimeData.aggregate([
        {
          $match: {
            spent_time: { $lt: hours },
            date: { $in: dateMondayToSFriday },
          },
        },
        {
          $group: {
            _id: '$email',
            spent_time: { $last: '$spent_time' },
            date: { $last: '$date' },
          },
        },
        {
          $project: {
            _id: 0,
            email: '$_id',
            spent_time: 1,
            date: 1,
          },
        },
      ]);

      let userTracker = [];
      await Promise.all(
        tracker.map(async (item) => {
          const findUser = await userData
            .find({
              email: item.email,
              deactive: { $ne: true },
            })
            .select('id email -_id');

          findUser.map((user) => {
            if (user.email === item.email)
              userTracker.push({
                id: user.id,
                email: user.email,
                spent_time: item.spent_time / HOURS_IN_SECONDS,
                date: item.date,
              });
          });
        })
      );

      userTracker.sort(
        (a, b) => parseFloat(a.spent_time) - parseFloat(b.spent_time)
      );

      let mess;
      if (!userTracker) {
        return;
      } else if (Array.isArray(userTracker) && userTracker.length === 0) {
        mess = '```' + 'Không có ai vi phạm trong tuần' + '```';
        return message.reply(mess).catch(console.error);
      } else {
        for (let i = 0; i <= Math.ceil(userTracker.length / 50); i += 1) {
          if (userTracker.slice(i * 50, (i + 1) * 50).length === 0) break;
          dateMondayToSFriday.map((dateWeekly) => {
            let dataTracker = userTracker;
            mess = dataTracker
              .slice(i * 50, (i + 1) * 50)
              .filter((item) => item.date === dateWeekly)
              .map(
                (check) => `${check.email} ${check.spent_time.toFixed(2)} giờ`
              )
              .join('\n');
            const day = dateWeekly.slice(0, 2);
            const month = dateWeekly.slice(3, 5);
            const year = dateWeekly.slice(6);

            const fomat = `${month}/${day}/${year}`;
            let Embed = new MessageEmbed()
              .setTitle(
                `Những người không bật đủ thời gian tracker trong ngày ${fomat}`
              )
              .setColor('RED')
              .setDescription(`${mess}`);
            return message.reply({ embeds: [Embed] }).catch(console.error);
          });
        }
      }
    }
  }
  if (args[1] !== 'daily' && args[1] !== 'weekly') {
    const day = args[1].slice(0, 2);
    const month = args[1].slice(3, 5);
    const year = args[1].slice(6);
    const fomat = `${month}/${day}/${year}`;
    if (args[2]) {
      const tracker = await trackerSpentTimeData.find({
        email: args[2],
        date: fomat,
      });
      if (tracker.length === 0) return message.channel.send(messHelp);

      let userTracker = [];
      await Promise.all(
        tracker.map(async (item) => {
          const findUser = await userData
            .find({
              email: item.email,
              deactive: { $ne: true },
            })
            .select('id email -_id');

          findUser.map((user) => {
            if (user.email === item.email)
              userTracker.push({
                id: user.id,
                email: user.email,
                spent_time: item.spent_time / HOURS_IN_SECONDS,
              });
          });
        })
      );

      userTracker.sort(
        (a, b) => parseFloat(a.spent_time) - parseFloat(b.spent_time)
      );

      let mess;
      if (!userTracker) {
        return;
      } else if (Array.isArray(userTracker) && userTracker.length === 0) {
        mess = '```' + `Không có bản ghi nào cho ngày ${args[1]}` + '```';
        return message.reply(mess).catch(console.error);
      } else {
        for (let i = 0; i <= Math.ceil(userTracker.length / 50); i += 1) {
          if (userTracker.slice(i * 50, (i + 1) * 50).length === 0) break;
          mess = userTracker
            .slice(i * 50, (i + 1) * 50)
            .map((check) => `${check.email} ${check.spent_time.toFixed(2)} giờ`)
            .join('\n');
          const Embed = new MessageEmbed()
            .setTitle(`Thời gian sử dụng tracker của bạn trong ngày ${args[1]}`)
            .setColor('RED')
            .setDescription(`${mess}`);
          await message.reply({ embeds: [Embed] }).catch(console.error);
        }
      }
    } else {
      const tracker = await trackerSpentTimeData.aggregate([
        {
          $match: {
            spent_time: { $lt: hours },
            date: fomat,
          },
        },
        {
          $group: {
            _id: '$email',
            spent_time: { $last: '$spent_time' },
          },
        },
        {
          $project: {
            _id: 0,
            email: '$_id',
            spent_time: 1,
          },
        },
      ]);

      let userTracker = [];
      await Promise.all(
        tracker.map(async (item) => {
          const findUser = await userData
            .find({
              email: item.email,
              deactive: { $ne: true },
            })
            .select('id email -_id');

          findUser.map((user) => {
            if (user.email === item.email)
              userTracker.push({
                id: user.id,
                email: user.email,
                spent_time: item.spent_time / HOURS_IN_SECONDS,
              });
          });
        })
      );

      userTracker.sort(
        (a, b) => parseFloat(a.spent_time) - parseFloat(b.spent_time)
      );

      let mess;
      if (!userTracker) {
        return;
      } else if (Array.isArray(userTracker) && userTracker.length === 0) {
        mess = '```' + `Không có ai vi phạm trong ngày ${args[1]}` + '```';
        return message.reply(mess).catch(console.error);
      } else {
        for (let i = 0; i <= Math.ceil(userTracker.length / 50); i += 1) {
          if (userTracker.slice(i * 50, (i + 1) * 50).length === 0) break;
          mess = userTracker
            .slice(i * 50, (i + 1) * 50)
            .map((check) => `${check.email} ${check.spent_time.toFixed(2)} giờ`)
            .join('\n');
          const Embed = new MessageEmbed()
            .setTitle(
              `Những người không bật đủ thời gian tracker trong ngày ${args[1]}`
            )
            .setColor('RED')
            .setDescription(`${mess}`);
          await message.reply({ embeds: [Embed] }).catch(console.error);
        }
      }
    }
  }
}

module.exports = { reportTracker };
