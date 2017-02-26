var x = 'test';

System.import('npmModule' + x);

System.import('./myModule/' + x + '/file');

System.import(`./myModule/${x}/file`);
