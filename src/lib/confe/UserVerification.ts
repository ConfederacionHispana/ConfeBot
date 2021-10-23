import axios from 'axios';
import { addDays, differenceInDays, format as formatDate, parse as parseDate } from 'date-fns';
import { es } from 'date-fns/locale';
import FandomUtilities from '#lib/fandom/FandomUtilities';

import type { AxiosError } from 'axios';

interface IVerificationResult {
  success: boolean;
  user?: {
    name: string;
    id: number;
    groups?: string[];
  };
  error?: string;
  errorDescription?: string;
  blockinfo?: {
    performer: string;
    expiry: Date | number;
    reason?: string;
  };
}

export default class UserVerification {
  static async verifyUser(
    fandomUsername: string,
    discordUsername: string,
    discrim: string
  ): Promise<IVerificationResult> {
    const discordTag = `${discordUsername}#${discrim}`;
    const mwUser = await FandomUtilities.getUserInfo('comunidad', fandomUsername);
    const registrationDate = new Date(mwUser.registration);

    if (differenceInDays(Date.now(), registrationDate) < 5) {
      const allowedDate = formatDate(addDays(registrationDate, 5), "d 'de' MMMM 'de' yyyy, h:mm:ss aa", {
        locale: es
      });

      return {
        success: false,
        error: 'AccountTooNew',
        errorDescription: `La cuenta ${fandomUsername} fue registrada hace menos de 5 días.\nVuelve a intentarlo después del ${allowedDate}.`
      };
    }

    if (mwUser.blockexpiry && mwUser.blockedby) {
      const blockExpiry =
        mwUser.blockexpiry !== 'infinity' ? parseDate(mwUser.blockexpiry, 'yyyyMMddHHmmss', new Date()) : Infinity;
      return {
        success: false,
        error: 'Blocked',
        errorDescription: `La cuenta ${fandomUsername} está actualmente bloqueada.\nVuelve a intentarlo cuando el bloqueo haya expirado.`,
        blockinfo: {
          performer: mwUser.blockedby,
          expiry: blockExpiry,
          reason: mwUser.blockreason
        }
      };
    }

    try {
      const { data: discordHandle }: { data: { name: string; value: string } } = await axios.get(
        `https://services.fandom.com/user-attribute/user/${mwUser.userid}/attr/discordHandle?cb=${Date.now()}`
      );
      if (discordHandle.name && discordHandle.value) {
        const expectedTag = discordHandle.value.trim();
        const expectedName = expectedTag.substring(0, expectedTag.lastIndexOf('#')).trim();
        const expectedDisc = expectedTag.substring(expectedTag.lastIndexOf('#') + 1, expectedTag.length).trim();

        if (discordUsername === expectedName && discrim === expectedDisc) {
          return {
            success: true,
            user: {
              name: mwUser.name,
              id: mwUser.userid,
              groups: mwUser.groups
            }
          };
        }
        return {
          success: false,
          error: 'DiscordHandleMismatch',
          errorDescription: `Tu Discord Tag no coincide con el que se indica en tu perfil de Fandom (tu tag es **${discordTag}**, mientras que tu perfil de Fandom ${
            expectedTag ? `indica **${expectedTag}**` : 'no tiene ningún tag asociado'
          }). ¿Tal vez olvidaste actualizarlo?`
        };
      }
      return {
        success: false,
        error: 'DiscordHandleNotFound',
        errorDescription:
          'Tu perfil de Fandom no tiene ningún Discord Tag asociado.\nSi acabas de añadir tu tag, espera unos minutos y vuelve a intentar.'
      };
    } catch (err) {
      if ((err as AxiosError).response?.status === 404) {
        return {
          success: false,
          error: 'DiscordHandleNotFound',
          errorDescription:
            'Tu perfil de Fandom no tiene ningún Discord Tag asociado.\nSi acabas de añadir tu tag, espera unos minutos y vuelve a intentar.'
        };
      }
      throw err;
    }
  }
}
