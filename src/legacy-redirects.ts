/**
 * URLs from the pre-Astro (Jekyll) version of this site. They are still indexed
 * by search engines and linked to from other sites, so each one is emitted as a
 * small redirect page by `src/pages/[legacy].html.ts`.
 *
 * Keys are the old path without the leading slash or the `.html` suffix.
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
	enableChromeDevTools: '/blog/2018-03-18-enable-chrome-dev-tools/',
	ldap: '/blog/2018-03-18-my-experiments-with-ldap/',
	rndeck: '/blog/2018-03-18-rndeck/',
	zksinstall: '/blog/2018-03-18-zksinstall/',
	hdp: '/blog/2018-03-25-hdp/',
	'udeploy-3': '/blog/2018-04-09-automated-creation-of-application-in-udeploy-using-python-and-rest/',
	'udeploy-2': '/blog/2018-04-09-automated-creation-of-components-in-udeploy-using-python-and-rest/',
	WAS: '/blog/2018-04-09-installing-was-855-fp-11-using-response-file/',
	'hdf-kafka': '/blog/2018-04-11-kafka-hdf/',
	'udeploy-1': '/blog/2018-04-18-connecting-to-udeploy-via-rest-and-python/',
	'ansible-getting-started': '/blog/2018-04-20-getting-started-with-ansible-using-vagrant/',
	'integrating-slack-with-rally': '/blog/2018-04-27-integrating-slack-with-rally/',
	'linux-hacks': '/blog/2018-04-29-linux-hacks/',
	cors: '/blog/2018-05-09-cors/',
	kafka_acls: '/blog/2018-06-09-kafka-acls/',
	kafka_cmds: '/blog/2018-06-09-kafka-cmds/',
	kafka_ssl: '/blog/2018-06-09-kafka-ssl/',
	pedes: '/blog/2018-06-30-pedes/',
	designdocs_automated: '/blog/2018-07-18-automated/',
	facerecog: '/blog/2018-07-18-face-recognition/',
	'installing-cuda': '/blog/2018-08-05-installing-cuda/',
	cifar_cnn: '/blog/2018-08-07-cifar-cnn/',
	cataract_detect: '/blog/2018-08-08-cataract-detect/',
	cataract_detection_using_keras: '/blog/2018-08-09-cataract-detection-using-keras/',
	fourier_transform: '/blog/2018-08-24-fourier-transform/',
	fourier_lpf: '/blog/2018-09-13-fourier-lpf/',
	archives: '/blog/',
	categories: '/blog/',
	tags: '/blog/',
};
