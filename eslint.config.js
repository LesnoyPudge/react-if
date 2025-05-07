import { config } from '@lesnoypudge/eslint-config';



const _ = config.createConfig(
    config.configs.base,
    {
        ...config.configs.node,
        files: ['./tests/**/*.test.ts'],
    },
    config.configs.disableTypeChecked,
);

export default _;