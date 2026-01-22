/**
 * Navigation and UI layout icons
 */

export const HomeIcon = ({ size = 16 }: { size: number }) => {
	return (
		<svg
			height={size}
			strokeLinejoin="round"
			style={{ color: "currentcolor" }}
			viewBox="0 0 16 16"
			width={size}
		>
			<path
				clipRule="evenodd"
				d="M12.5 6.56062L8.00001 2.06062L3.50001 6.56062V13.5L6.00001 13.5V11C6.00001 9.89539 6.89544 8.99996 8.00001 8.99996C9.10458 8.99996 10 9.89539 10 11V13.5L12.5 13.5V6.56062ZM13.78 5.71933L8.70711 0.646409C8.31659 0.255886 7.68342 0.255883 7.2929 0.646409L2.21987 5.71944C2.21974 5.71957 2.21961 5.7197 2.21949 5.71982L0.469676 7.46963L-0.0606537 7.99996L1.00001 9.06062L1.53034 8.53029L2.00001 8.06062V14.25V15H2.75001L6.00001 15H7.50001H8.50001H10L13.25 15H14V14.25V8.06062L14.4697 8.53029L15 9.06062L16.0607 7.99996L15.5303 7.46963L13.7806 5.71993C13.7804 5.71973 13.7802 5.71953 13.78 5.71933ZM8.50001 11V13.5H7.50001V11C7.50001 10.7238 7.72386 10.5 8.00001 10.5C8.27615 10.5 8.50001 10.7238 8.50001 11Z"
				fill="currentColor"
				fillRule="evenodd"
			/>
		</svg>
	);
};

export const MenuIcon = ({ size = 16 }: { size?: number }) => {
	return (
		<svg
			height={size}
			strokeLinejoin="round"
			style={{ color: "currentcolor" }}
			viewBox="0 0 16 16"
			width={size}
		>
			<path
				clipRule="evenodd"
				d="M1 2H1.75H14.25H15V3.5H14.25H1.75H1V2ZM1 12.5H1.75H14.25H15V14H14.25H1.75H1V12.5ZM1.75 7.25H1V8.75H1.75H14.25H15V7.25H14.25H1.75Z"
				fill="currentColor"
				fillRule="evenodd"
			/>
		</svg>
	);
};

export const SidebarLeftIcon = ({ size = 16 }: { size?: number }) => (
	<svg
		height={size}
		strokeLinejoin="round"
		style={{ color: "currentcolor" }}
		viewBox="0 0 16 16"
		width={size}
	>
		<path
			clipRule="evenodd"
			d="M6.245 2.5H14.5V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H6.245V2.5ZM4.995 2.5H1.5V12.5C1.5 13.0523 1.94772 13.5 2.5 13.5H4.995V2.5ZM0 1H1.5H14.5H16V2.5V12.5C16 13.8807 14.8807 15 13.5 15H2.5C1.11929 15 0 13.8807 0 12.5V2.5V1Z"
			fill="currentColor"
			fillRule="evenodd"
		/>
	</svg>
);

export const ChevronDownIcon = ({ size = 16 }: { size?: number }) => (
	<svg
		height={size}
		strokeLinejoin="round"
		style={{ color: "currentcolor" }}
		viewBox="0 0 16 16"
		width={size}
	>
		<path
			clipRule="evenodd"
			d="M12.0607 6.74999L11.5303 7.28032L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L5.53032 6.21966L7.99999 8.68933L10.4697 6.21966L11 5.68933L12.0607 6.74999Z"
			fill="currentColor"
			fillRule="evenodd"
		/>
	</svg>
);

export const ArrowUpIcon = ({
	size = 16,
	...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
	return (
		<svg
			height={size}
			strokeLinejoin="round"
			style={{ color: "currentcolor", ...props.style }}
			viewBox="0 0 16 16"
			width={size}
			{...props}
		>
			<path
				clipRule="evenodd"
				d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z"
				fill="currentColor"
				fillRule="evenodd"
			/>
		</svg>
	);
};

export const RouteIcon = ({ size = 16 }: { size?: number }) => {
	return (
		<svg
			height={size}
			strokeLinejoin="round"
			style={{ color: "currentcolor" }}
			viewBox="0 0 16 16"
			width={size}
		>
			<path
				clipRule="evenodd"
				d="M7.53033 0.719661L7 0.189331L5.93934 1.24999L6.46967 1.78032L6.68934 1.99999H3.375C1.51104 1.99999 0 3.51103 0 5.37499C0 7.23895 1.51104 8.74999 3.375 8.74999H12.625C13.6605 8.74999 14.5 9.58946 14.5 10.625C14.5 11.6605 13.6605 12.5 12.625 12.5H4.88555C4.56698 11.4857 3.61941 10.75 2.5 10.75C1.11929 10.75 0 11.8693 0 13.25C0 14.6307 1.11929 15.75 2.5 15.75C3.61941 15.75 4.56698 15.0143 4.88555 14H12.625C14.489 14 16 12.489 16 10.625C16 8.76103 14.489 7.24999 12.625 7.24999H3.375C2.33947 7.24999 1.5 6.41052 1.5 5.37499C1.5 4.33946 2.33947 3.49999 3.375 3.49999H6.68934L6.46967 3.71966L5.93934 4.24999L7 5.31065L7.53033 4.78032L8.85355 3.4571C9.24408 3.06657 9.24408 2.43341 8.85355 2.04288L7.53033 0.719661ZM2.5 14.25C3.05228 14.25 3.5 13.8023 3.5 13.25C3.5 12.6977 3.05228 12.25 2.5 12.25C1.94772 12.25 1.5 12.6977 1.5 13.25C1.5 13.8023 1.94772 14.25 2.5 14.25ZM14.5 2.74999C14.5 3.30228 14.0523 3.74999 13.5 3.74999C12.9477 3.74999 12.5 3.30228 12.5 2.74999C12.5 2.19771 12.9477 1.74999 13.5 1.74999C14.0523 1.74999 14.5 2.19771 14.5 2.74999ZM16 2.74999C16 4.1307 14.8807 5.24999 13.5 5.24999C12.1193 5.24999 11 4.1307 11 2.74999C11 1.36928 12.1193 0.249991 13.5 0.249991C14.8807 0.249991 16 1.36928 16 2.74999Z"
				fill="currentColor"
				fillRule="evenodd"
			/>
		</svg>
	);
};

export const GPSIcon = ({ size = 16 }: { size: number }) => {
	return (
		<svg
			height={size}
			strokeLinejoin="round"
			style={{ color: "currentcolor" }}
			viewBox="0 0 16 16"
			width={size}
		>
			<path
				d="M1 6L15 1L10 15L7.65955 8.91482C7.55797 8.65073 7.34927 8.44203 7.08518 8.34045L1 6Z"
				fill="transparent"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="bevel"
				strokeWidth="1.5"
			/>
		</svg>
	);
};

export const FullscreenIcon = ({ size = 16 }: { size?: number }) => (
	<svg
		height={size}
		strokeLinejoin="round"
		style={{ color: "currentcolor" }}
		viewBox="0 0 16 16"
		width={size}
	>
		<path
			clipRule="evenodd"
			d="M1 5.25V6H2.5V5.25V2.5H5.25H6V1H5.25H2C1.44772 1 1 1.44772 1 2V5.25ZM5.25 14.9994H6V13.4994H5.25H2.5V10.7494V9.99939H1V10.7494V13.9994C1 14.5517 1.44772 14.9994 2 14.9994H5.25ZM15 10V10.75V14C15 14.5523 14.5523 15 14 15H10.75H10V13.5H10.75H13.5V10.75V10H15ZM10.75 1H10V2.5H10.75H13.5V5.25V6H15V5.25V2C15 1.44772 14.5523 1 14 1H10.75Z"
			fill="currentColor"
			fillRule="evenodd"
		/>
	</svg>
);
