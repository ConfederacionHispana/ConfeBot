import { Listener } from 'discord-akairo';

class MemberAddListener extends Listener {
  constructor() {
    super('guildMemberAdd', {
      emitter: 'client',
      event: 'guildMemberAdd'
    });
  }

  exec(member) {
    if (member.guild.id !== process.env.GUILD_ID) return;
    this.client.rollbar.debug('Nuevo miembro', {
      member: member
    });
    const welcomeChannel = member.guild.channels.resolve(process.env.WELCOME_CHANNEL),
      logsChannel = member.guild.channels.resolve(process.env.LOGS_CHANNEL);
    member.roles.add(process.env.NEWUSER_ROLE).then(() => {
      welcomeChannel.send(`¡Bienvenid@ <@!${member.user.id}> a la **Confederación de Fandom Hispano**!`, {
        embed: {
          color: 2936518,
          thumbnail: {
            url: 'https://vignette4.wikia.nocookie.net/confederacion-hispana/es/images/8/89/Wiki-wordmark.png'
          },
          description: `Para acceder a todos los canales del servidor, necesitamos que completes una pequeña verificación:\n\nSi aún no lo has hecho, dirígete a [tu perfil de Fandom](https://comunidad.fandom.com/wiki/Especial:MiPágina), y en la parte superior del mismo (perfil global) añade tu Discord Tag en el campo destinado a ello.\n\nLuego, envía un mensaje en <#${process.env.VERIF_CHANNEL}> con tus datos. **Dado que los mensajes son verificados por un bot, te pedimos que sigas este formato:** \`\`\`\nUsuario: Tu nombre de usuario\nWiki: Wikis en las que contribuyes (separadas por coma)\nInvitación: ¿Cómo llegaste aquí? Si te invitó alguien que ya está en el servidor, puedes @Mencionarle\`\`\``,
          fields: [
            {
              name: '¿No tienes una cuenta en Fandom?',
              value: 'Reacciona con el emoji 🌐, esto avisará a los miembros del staff del servidor para poder verificarte manualmente.'
            },
            {
              name: '¿Tienes algún incoveniente para completar la verificación?',
              value: `Menciona a algún miembro del <@&${process.env.STAFF_ROLE}> e intentaremos ayudarte.`
            }
          ]
        }
      }).then((sentMessage) => {
        const filter = (reaction, user) => {
          return ['🌐'].includes(reaction.emoji.name) && user.id === member.id;
        };
        sentMessage.awaitReactions(filter, {
          max: 1,
          time: 3600000, // 1h
          errors: ['time']
        }).then((collected) => {
          const reaction = collected.first();
          if (reaction.emoji.name === '🌐') {
            logsChannel.send(`<@&${process.env.STAFF_ROLE}>: se requiere verificación manual para <@!${member.user.id}>`).catch(this.client.rollbar.error);
          }
        }).catch(collected => {
          // idk lol
        });
      }).catch((err) => {
        logsChannel.send(`❌ Imposible enviar mensaje de bienvenida a <@!${member.user.id}>: ${err.message} (${err.name})`).catch(this.client.rollbar.error);
        this.client.rollbar.error('Error al enviar mensaje de bienvenida', err);
      });
    }).catch((err) => {
      logsChannel.send(`❌ Imposible agregar el rol Nuevo Ingreso a <@!${member.user.id}>: ${err.message} (${err.name})`).catch(this.client.rollbar.error);
      this.client.rollbar.error('Error al agregar rol \'Nuevo Ingreso\'', err);
    });
  }
}

export default MemberAddListener;