const KickNonVerifiedMembers = (client) => {
  client.logger.info('Running scheduled task: KickNonVerifiedMembers');
  const guild = client.guilds.resolve(process.env.GUILD_ID),
    newUserRole = guild.roles.resolve(process.env.NEWUSER_ROLE),
    logsChannel = guild.channels.resolve(process.env.LOGS_CHANNEL);

  newUserRole.members.each((member) => {
    if (member.roles.cache.has(process.env.USER_ROLE)) {
      /*
      * if member has already verified but still has the newUserRole, remove newUserRole from them.
      * this normally shouldn't happen, but... ¯\_(ツ)_/¯
      */
      return member.roles.remove(newUserRole).catch(client.rollbar.error);
    }
    if (!member.joinedTimestamp) return;
    const timestampDifference = new Date() - member.joinedTimestamp,
      differenceDays = timestampDifference / (1000 * 3600 * 24);
    if (differenceDays >= 2) {
      member.send(`¡Hola! Esto es una notificación para informarte que se te ha expulsado automáticamente de la **Confederación de Fandom Hispano** porque no has completado a tiempo el formulario. No te preocupes, puedes volver a unirte cuando desees mediante este enlace: <${process.env.GUILD_INVITE}>, o desde <https://confederacion-hispana.fandom.com/es/>. ¡Te esperamos!`)
        .catch(client.rollbar.error)
        .finally(() => {
          member.kick('Expulsión automática pasadas 48 horas sin llenar el formulario').then(() => {
            logsChannel.send(`Se expulsó a <@!${member.user.id}> (${member.user.username}#${member.user.discriminator}) al cumplirse 48 horas sin llenar el formulario.`).catch(client.rollbar.error);
          }).catch((err) => {
            logsChannel.send(`Error al expulsar a <@!${member.user.id}>: ${err.message} (${err.name})`).catch(client.rollbar.error);
            client.rollbar.error('Error al expulsar miembro por inactividad', err);
          });
        });
    }
  });
};

export default KickNonVerifiedMembers;
