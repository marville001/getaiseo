"use client";

import { Input } from "@/components/ui/input";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Option {
	value: string;
	label: string;
}

interface MultiSelectProps {
	options: Option[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
}

export default function MultiSelect({
	options,
	value,
	onChange,
	placeholder = "Select items...",
	disabled = false,
}: MultiSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);

	const filteredOptions = options.filter((opt) =>
		opt.label.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const selectedLabels = options
		.filter((opt) => value.includes(opt.value))
		.map((opt) => opt.label);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const toggleOption = (optionValue: string) => {
		const newValue = value.includes(optionValue)
			? value.filter((v) => v !== optionValue)
			: [...value, optionValue];
		onChange(newValue);
	};

	const removeOption = (optionValue: string) => {
		onChange(value.filter((v) => v !== optionValue));
	};

	return (
		<div ref={containerRef} className="relative">
			<div
				onClick={() => !disabled && setIsOpen(!isOpen)}
				className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-10"
			>
				<div className="flex flex-wrap gap-2 flex-1">
					{selectedLabels.length > 0 ? (
						selectedLabels.map((label) => {
							const option = options.find((opt) => opt.label === label);
							return (
								<div
									key={option?.value}
									className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
								>
									{label}
									<button
										onClick={(e) => {
											e.stopPropagation();
											option && removeOption(option.value);
										}}
										className="hover:text-blue-600"
										disabled={disabled}
									>
										<X className="h-3 w-3" />
									</button>
								</div>
							);
						})
					) : (
						<span className="text-gray-500">{placeholder}</span>
					)}
				</div>
				<ChevronDown
					className={`h-4 w-4 text-gray-400 transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</div>

			{isOpen && !disabled && (
				<div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
					<Input
						placeholder="Search websites..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="m-2 border-gray-200"
					/>

					<div className="max-h-48 overflow-y-auto">
						{filteredOptions.length === 0 ? (
							<div className="px-3 py-2 text-sm text-gray-500">
								No options found
							</div>
						) : (
							filteredOptions.map((option) => (
								<label
									key={option.value}
									className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
								>
									<input
										type="checkbox"
										checked={value.includes(option.value)}
										onChange={() => toggleOption(option.value)}
										className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
									/>
									<span className="ml-2 text-sm">{option.label}</span>
								</label>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
