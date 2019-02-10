var x = 'test';

System.import('npmModule'.concat(x));

System.import('./myModule/'.concat(x, '/file'));

System.import(`./myModule/${x}/file`);
