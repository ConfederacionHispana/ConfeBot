import type { Args, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { ConfeBot } from '../../lib';
import type { Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { sleep } from '../../lib'

interface IEvalCommandResult {
  result: unknown;
  success: boolean;
  time: number;
}

@ApplyOptions<CommandOptions>({
  aliases: ['ev'],
  flags: ['async'],
  name: 'eval',
  preconditions: ['StaffOnly']
})
export class EvalCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const result = await this.timedEval(message, args);
    const embed = new MessageEmbed({
      color: 'RANDOM',
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      description: `\`\`\`ts\n${result.result}\n\`\`\``,
      fields: [
        {
          inline: true,
          name: 'Status',
          value: result.success ? ':white_check_mark: Success' : ':x: Failed'
        },
        {
          inline: true,
          name: 'Time',
          value: `:stopwatch: ${result.time} ms`
        }
      ],
      title: 'Evaluation result'
    });
    message.channel
      .send({
        embeds: [embed]
      })
      .catch((e: Error) => {
        const client = this.container.client as ConfeBot;
        client.logException(e, {
          command: this.name,
          error: e.message,
          message,
          type: 'command-reply'
        });
      });
  }

  private timedEval(message: Message, args: Args): Promise<IEvalCommandResult> {
    return Promise.race([
      sleep(5000).then(() => ({
        result: '// The evaluation took more than 5s and was aborted.',
        success: false,
        time: 5000
      })),
      this.eval(message, args)
    ]);
  }

  private async eval(message: Message, args: Args): Promise<IEvalCommandResult> {
    const asyncFlag = args.getFlags('async');
    let code = await args.rest('string');
    if (asyncFlag) code = `( async () => { ${code} } )()`;

    let result: unknown;
    let success: boolean;
    const time1 = Date.now();
    let time2: number;

    try {
      // eslint-disable-next-line no-eval
      result = await eval(code);
      success = true;
    } catch (error) {
      success = false;
    } finally {
      time2 = Date.now();
    }

    return {
      result,
      success,
      time: time2 - time1
    };
  }
}
