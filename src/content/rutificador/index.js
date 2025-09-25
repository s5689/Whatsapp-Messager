import { BACKGROUND } from '../../globals';
import { backgroundCall } from '../lib';

export default async function rutificador() {
  const resp = await backgroundCall({
    msg: 'rutificador-call',
    target: BACKGROUND,
  });

  console.log(resp);
}
