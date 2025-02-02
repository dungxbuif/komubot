const dailyData = require('../../models/dailyData.js');
const { sendErrorToDevTest } = require('../../util/komubotrest.js');
const axios = require('axios');

function setTime(date, hours, minute, second, msValue) {
  return date.setHours(hours, minute, second, msValue);
}

function checkTimeSheet() {
  let result = false;
  const time = new Date();
  const cur = new Date();
  const timezone = time.getTimezoneOffset() / -60;

  const fisrtTimeMorning = new Date(
    setTime(time, 0 + timezone, 30, 0, 0)
  ).getTime();
  const lastTimeMorning = new Date(
    setTime(time, 2 + timezone, 31, 0, 0)
  ).getTime();
  const fisrtTimeAfternoon = new Date(
    setTime(time, 5 + timezone, 0, 0, 0)
  ).getTime();
  const lastTimeAfternoon = new Date(
    setTime(time, 7 + timezone, 1, 0, 0)
  ).getTime();

  if (
    (cur.getTime() >= fisrtTimeMorning && cur.getTime() <= lastTimeMorning) ||
    (cur.getTime() >= fisrtTimeAfternoon && cur.getTime() <= lastTimeAfternoon)
  ) {
    result = true;
  }
  return result;
}

function checkTimeNotWFH() {
  let resultWfh = false;
  const time = new Date();
  const cur = new Date();
  const timezone = time.getTimezoneOffset() / -60;

  const fisrtTimeWFH = new Date(
    setTime(time, 0 + timezone, 30, 0, 0)
  ).getTime();
  const lastTimeWFH = new Date(setTime(time, 10 + timezone, 0, 0, 0)).getTime();

  if (cur.getTime() >= fisrtTimeWFH && cur.getTime() <= lastTimeWFH) {
    resultWfh = true;
  }
  return resultWfh;
}

function getUserNameByEmail(string) {
  if (string.includes('@ncc.asia')) {
    return string.slice(0, string.length - 9);
  }
}

// function findPeriod(daily) {
//   let period = false;
//   let dailyReplace = daily.replace('\n', ' ');
//   const arrDaily = dailyReplace.split(' ');
//   arrDaily.map((item) => {
//     if (item.length > 15) {
//       period = true;
//       return period;
//     }
//     if (!period) {
//       for (let i = 1; i < 6; i++) {
//         for (let j = 0; j < item.length; j++) {
//           let currChar = item.slice(j, j + i).toLowerCase();
//           let comparator = item.slice(j + i, j + i + i).toLowerCase();
//           let twoComparator = item
//             .slice(j + i + i, j + i + i + i)
//             .toLowerCase();
//           if (i === 1 || i === 2) {
//             if (currChar === comparator && currChar === twoComparator) {
//               period = true;
//               return period;
//             } else {
//               period = false;
//             }
//           } else {
//             if (currChar === comparator) {
//               period = true;
//               return period;
//             } else {
//               period = false;
//             }
//           }
//         }
//       }
//     }
//   });
//   return period;
// }

const messHelp =
  '```' +
  'Please daily follow this template' +
  '\n' +
  '*daily dd/mm/yyyy' +
  '\n' +
  '- yesterday:' +
  '\n' +
  '- today:' +
  '\n' +
  '- block: ' +
  '```';

module.exports = {
  name: 'daily',
  description: 'WFH Daily',
  cat: 'komu',
  async execute(message, args, client) {
    try {
      let authorId = message.author.id;
      let authorUsername = message.author.username;
      const daily = args.join(' ');

      let checkDaily = false;
      const wordInString = (s, word) =>
        new RegExp('\\b' + word + '\\b', 'i').test(s);
      ['yesterday', 'today', 'block'].forEach((q) => {
        if (!wordInString(daily, q)) return (checkDaily = true);
      });

      if (checkDaily) {
        return message
          .reply({
            content: messHelp,
            ephemeral: true,
          })
          .catch((err) => {
            sendErrorToDevTest(client, authorId, err);
          });
      }

      if (!daily || daily == undefined) {
        return message
          .reply({
            content: '```please add your daily text```',
            ephemeral: true,
          })
          .catch((err) => {
            sendErrorToDevTest(client, authorId, err);
          });
      }

      if (daily.length < 100) {
        return message
          .reply({
            content:
              '```Please enter at least 100 characters in your daily text```',
            ephemeral: true,
          })
          .catch((err) => {
            sendErrorToDevTest(client, authorId, err);
          });
      }

      // if (findPeriod(daily)) {
      //   return message
      //     .reply({
      //       content: '```Please chat with correct syntax```',
      //       ephemeral: true,
      //     })
      //     .catch((err) => {
      //       sendErrorToDevTest(client, authorId, err);
      //     });
      // }

      const date = new Date();
      let wfhGetApi;
      try {
        const url = date
          ? `${client.config.wfh.api_url}?date=${date.toDateString()}`
          : client.config.wfh.api_url;
        wfhGetApi = await axios.get(url, {
          headers: {
            securitycode: process.env.WFH_API_KEY_SECRET,
          },
        });
      } catch (error) {
        console.log(error);
      }

      const wfhUserEmail = wfhGetApi.data.result.map((item) =>
        getUserNameByEmail(item.emailAddress)
      );

      if (wfhUserEmail.includes(authorUsername)) {
        await new dailyData({
          userid: message.author.id,
          email:
            message.member != null || message.member != undefined
              ? message.member.displayName
              : message.author.username,
          daily: daily,
          createdAt: new Date(),
          channelid: message.channel.id,
        })
          .save()
          .catch((err) => console.log(err));
        if (!checkTimeSheet()) {
          message
            .reply({
              content:
                '```✅ Daily saved. (Invalid daily time frame. Please daily at 7h30-9h30, 12h-14h. WFH not daily 20k/day.)```',
              ephemeral: true,
            })
            .catch((err) => {
              sendErrorToDevTest(client, authorId, err);
            });
        } else {
          message
            .reply({ content: '`✅` Daily saved.', ephemeral: true })
            .catch((err) => {
              sendErrorToDevTest(client, authorId, err);
            });
        }
      } else {
        await new dailyData({
          userid: message.author.id,
          email:
            message.member != null || message.member != undefined
              ? message.member.displayName
              : message.author.username,
          daily: daily,
          createdAt: new Date(),
          channelid: message.channel.id,
        })
          .save()
          .catch((err) => console.log(err));
        if (!checkTimeNotWFH()) {
          message
            .reply({
              content:
                '```✅ Daily saved. (Invalid daily time frame. Please daily at 7h30-17h. not daily 20k/day.)```',
              ephemeral: true,
            })
            .catch((err) => {
              sendErrorToDevTest(client, authorId, err);
            });
        } else {
          message
            .reply({ content: '`✅` Daily saved.', ephemeral: true })
            .catch((err) => {
              sendErrorToDevTest(client, authorId, err);
            });
        }
      }
    } catch (err) {
      console.log(err);
    }
  },
};
