import React from "react";
import { FiCopy, FiX, FiRefreshCw, FiSearch } from "react-icons/fi";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import SearchableSelect from "../../components/ui/SearchableSelect";
import CurrencySearchableSelect from "../../components/ui/CurrencySearchableSelect";
import SortableImageItem from "../../components/ui/SortableImageItem";
import SortableVideoItem from "../../components/ui/SortableVideoItem";
import { UploadIcon } from "../../components/common/Icons";

const ProductForm = ({
	Button,
	CURRENCY_LIST,
	CURRENCY_SYMBOL_MAP,
	CurrencySearchableSelect,
	DndContext,
	FiArrowDown,
	FiCopy,
	FiRefreshCw,
	FiSearch,
	FiX,
	Input,
	SearchableSelect,
	SortableContext,
	SortableImageItem,
	SortableVideoItem,
	UploadIcon,
	closestCenter,
	copiedFromProduct,
	countries,
	countryOptions,
	customAnimeTag,
	customCategory,
	customCountryInput,
	customStore,
	customSubCategory,
	data,
	editingId,
	errors,
	fetchFromUrl,
	fileInputRef,
	formAnimeOptions,
	formCategoryOptions,
	formData,
	formStoreOptions,
	getCustomCountries,
	handleCountryToggle,
	handleImageDragEndDnd,
	handleInputChange,
	handleSubmit,
	handleVideoDragEndDnd,
	imageItems,
	isDragOver,
	isFetchingUrl,
	isVideoDragOver,
	onDragEnterBox,
	onDragLeaveBox,
	onDropBox,
	onFileChange,
	onVideoDragEnter,
	onVideoDragLeave,
	onVideoDrop,
	onVideoFileChange,
	previewUrl,
	rectSortingStrategy,
	removeImage,
	removeVideo,
	sensors,
	setCopiedFromProduct,
	setCustomAnimeTag,
	setCustomCategory,
	setCustomCountryInput,
	setCustomStore,
	setCustomSubCategory,
	setErrors,
	setFormData,
	setMain,
	setPrimaryVideo,
	setShowCopyModal,
	setUrlToFetch,
	subCategoryMap,
	submitError,
	submitting,
	successMessage,
	toTitleCase,
	uploaded,
	uploadingCount,
	uploadingVideoCount,
	urlToFetch,
	verticalListSortingStrategy,
	videoFileInputRef,
	videoItems
}) => {
	const isWorking = submitting || uploadingCount > 0 || uploadingVideoCount > 0;
	const mainPreview = imageItems.find((img) => img.isMain) || imageItems[0];
	
	return (
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-8">
							{/* ── Copy-from-product banner (create mode only) ── */}
							{!editingId && (
								<div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-zinc-800/70 border border-zinc-700">
									<div className="flex-1">
										<p className="text-sm font-semibold text-white">Adding a product for another country?</p>
										<p className="text-xs text-zinc-400 mt-0.5">Copy all details including images and videos from an existing product.</p>
									</div>
									<button
										type="button"
										onClick={() => setShowCopyModal(true)}
										className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors shadow-md shadow-purple-900/30"
									>
										<FiCopy className="text-lg" /> Copy from existing
									</button>
								</div>
							)}
							<form onSubmit={handleSubmit} className="space-y-6">
								{submitError && (
									<div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
										{submitError}
									</div>
								)}
								{successMessage && (
									<div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-green-200 text-sm">
										{successMessage}
									</div>
								)}
								{/* ── Copied-from banner ── */}
								{copiedFromProduct && !editingId && (
									<div className="flex items-start gap-3 p-4 rounded-xl bg-blue-950/50 border border-blue-700/60 text-blue-200 text-sm">
										<FiCopy className="text-lg text-blue-400 shrink-0 mt-0.5" />
										<div className="flex-1">
											<p className="font-semibold text-blue-100">All data copied from <span className="text-purple-300">&ldquo;{copiedFromProduct}&rdquo;</span></p>
											<p className="text-xs text-blue-300 mt-0.5">Images and videos have been fetched and will be <span className="font-bold text-amber-300">re-uploaded as new files</span>.</p>
										</div>
										<button type="button" onClick={() => setCopiedFromProduct("")} className="text-blue-400 hover:text-white transition-colors flex-shrink-0">
											<FiX className="w-5 h-5" />
										</button>
									</div>
								)}

								{/* ── Auto-Import from URL banner ── */}
								<div className="mb-6 p-4 rounded-xl bg-zinc-800/70 border border-zinc-700">
									<h3 className="text-sm font-semibold text-white mb-2">Auto-Import from URL</h3>
									<p className="text-xs text-zinc-400 mb-3">Paste an affiliate link (e.g. from Diffbot-supported sites) to automatically extract the title, description, price, and image.</p>
									<div className="flex gap-2">
										<Input
											placeholder="https://..."
											value={urlToFetch}
											onChange={(e) => setUrlToFetch(e.target.value)}
											className="flex-1"
										/>
										<Button
											type="button"
											onClick={fetchFromUrl}
											disabled={isFetchingUrl || !urlToFetch}
											className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
										>
											{isFetchingUrl ? (
												<span className="flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Fetching...</span>
											) : (
												<span className="flex items-center gap-2"><FiSearch /> Fetch Data</span>
											)}
										</Button>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-lg font-bold text-white">
										Basic Information
									</h3>
									<Input
										label="Product Title"
										name="title"
										placeholder="e.g., Attack on Titan Hoodie"
										value={formData.title}
										onChange={handleInputChange}
										error={errors.title}
										maxLength={300}
										required
									/>
									<p className="text-xs text-right -mt-3" style={{ color: formData.title.length > 270 ? '#f87171' : '#71717a' }}>{formData.title.length}/300</p>
									<div>
										<label className="block text-sm font-medium text-zinc-200 mb-2">
											Description
										</label>
										<textarea
											name="description"
											placeholder="Detailed product description"
											value={formData.description}
											onChange={handleInputChange}
											rows="4"
											maxLength={2000}
											className={`w-full px-4 py-2.5 rounded-lg bg-zinc-800 border text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.description ? "border-red-500" : "border-zinc-700"}`}
										/>
										<div className="flex justify-between items-start mt-1">
											{errors.description ? (
												<p className="text-red-500 text-xs">{errors.description}</p>
											) : <span />}
											<p className="text-xs ml-auto" style={{ color: formData.description.length > 1900 ? '#f87171' : '#71717a' }}>{formData.description.length}/2000</p>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Category
											</label>
											<SearchableSelect
												name="category"
												value={formData.category}
												onChange={handleInputChange}
												options={formCategoryOptions}
												placeholder="Select Category"
											/>
											{formData.category === "Other" && (
												<Input
													placeholder="Enter custom category"
													value={customCategory}
													onChange={(e) => setCustomCategory(e.target.value)}
													className="mt-2"
													error={errors.category}
													required
												/>
											)}
										</div>
										{/* SubCategory - shown when the selected category has subcategories or is Other */}
										{(subCategoryMap[formData.category]?.length > 0 || formData.category === "Other") && (
											<div>
												<label className="block text-sm font-medium text-zinc-200 mb-2">
													Sub Category
													<span className="ml-2 text-xs text-zinc-500">(optional)</span>
												</label>
												{formData.category === "Other" ? (
													<Input
														placeholder="Enter custom sub-category"
														value={customSubCategory}
														onChange={(e) => setCustomSubCategory(e.target.value)}
													/>
												) : (
													<>
														<SearchableSelect
															name="subCategory"
															value={formData.subCategory}
															onChange={handleInputChange}
															options={[...(subCategoryMap[formData.category] || []), "Other"]}
															placeholder="— Select sub-category —"
														/>
														{formData.subCategory === "Other" && (
															<Input
																placeholder="Enter custom sub-category"
																value={customSubCategory}
																onChange={(e) => setCustomSubCategory(e.target.value)}
																className="mt-2"
																error={errors.subCategory}
																required
															/>
														)}
													</>
												)}
												{(formData.subCategory || customSubCategory) && (
													<p className="mt-1 text-xs text-violet-400 flex items-center gap-1">
														<span>✓</span> Sub-category set
													</p>
												)}
											</div>
										)}
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Anime
											</label>
											<SearchableSelect
												name="animeTag"
												value={formData.animeTag}
												onChange={handleInputChange}
												options={formAnimeOptions}
												placeholder="Select Anime"
											/>
											{formData.animeTag === "Other" && (
												<Input
													placeholder="Enter custom anime name"
													value={customAnimeTag}
													onChange={(e) =>
														setCustomAnimeTag(
															e.target.value,
														)
													}
													className="mt-2"
													required
												/>
											)}
											{errors.animeTag && (
												<p className="text-red-500 text-xs mt-1">
													{errors.animeTag}
												</p>
											)}
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<h3 className="text-lg font-bold text-white">
										Pricing & Links
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="md:col-span-2">
											<Input
												label="Price"
												name="price"
												type="text"
												inputMode="decimal"
												placeholder="2,999.99"
												value={formData.price}
												onChange={handleInputChange}
												error={errors.price}
												required
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Currency
											</label>
											{/* Show selected symbol preview */}
											{formData.currency && CURRENCY_SYMBOL_MAP[formData.currency] && (
												<div className="flex items-center gap-2 mb-2">
													<span className="inline-flex items-center gap-1.5 bg-purple-600/20 border border-purple-500/40 text-purple-300 text-sm font-bold px-3 py-1 rounded-lg">
														<span className="text-base">{CURRENCY_SYMBOL_MAP[formData.currency]}</span>
														<span>{formData.currency}</span>
													</span>
													<span className="text-zinc-500 text-xs">{CURRENCY_LIST.find(c => c.code === formData.currency)?.name}</span>
												</div>
											)}
											<CurrencySearchableSelect
												name="currency"
												value={formData.currency}
												onChange={handleInputChange}
												currencies={CURRENCY_LIST}
											/>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Store
											</label>
											<SearchableSelect
												name="store"
												value={formData.store}
												onChange={handleInputChange}
												options={formStoreOptions}
												placeholder="Select Store"
											/>
											{formData.store === "Other" && (
												<Input
													placeholder="Enter custom store name"
													value={customStore}
													onChange={(e) => setCustomStore(e.target.value)}
													className="mt-2"
													error={errors.store}
													required
												/>
											)}
										</div>
										<div className="md:col-span-2">
											{/* Highlight affiliate link after metadata copy */}
											{copiedFromProduct && !editingId && (
												<div className="mb-2 flex items-center gap-2 text-xs text-amber-400 font-semibold animate-pulse">
													<FiArrowDown className="text-sm" /> Ensure you update the country-specific affiliate link below
												</div>
											)}
											<Input
												label="Affiliate Link"
												name="affiliateLink"
												placeholder="https://..."
												value={formData.affiliateLink}
												onChange={handleInputChange}
												error={errors.affiliateLink}
												required
											/>
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<h3 className="text-lg font-bold text-white">
										Visibility & Scheduling
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="flex items-center gap-2 cursor-pointer mb-2">
												<input
													type="checkbox"
													name="isActive"
													checked={!formData.isActive}
													onChange={(e) => setFormData(p => ({...p, isActive: !e.target.checked}))}
													className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-purple-500"
												/>
												<span className="text-sm font-medium text-white">Private Mode (Hide Product)</span>
											</label>
											<p className="text-xs text-zinc-500 ml-6">If enabled, the product will be inactive and hidden from the main site. Use this for invalid links.</p>
										</div>
										<div>
											<label className="block text-sm font-medium text-zinc-200 mb-2">
												Schedule Upload Time
											</label>
											<input
												type="datetime-local"
												name="scheduledUploadTime"
												value={formData.scheduledUploadTime}
												onChange={handleInputChange}
												className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
											/>
											<p className="text-xs text-zinc-500 mt-1">Leave empty to publish immediately (or use active/inactive status).</p>
										</div>
									</div>
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<h3 className="text-lg font-bold text-white">
										Target Regions
									</h3>
									<div className="flex flex-wrap gap-3">
										{countryOptions.map((c) => (
											<button
												key={c}
												type="button"
												onClick={() => handleCountryToggle(c)}
												className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.countries.includes(c) ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
											>
												{c}
											</button>
										))}
										<button
											type="button"
											onClick={() => handleCountryToggle("Other")}
											className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.countries.includes("Other") ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
										>
											Other
										</button>
									</div>
									{formData.countries.includes("Other") && (
										<div className="mt-3">
											<label className="block text-sm font-medium text-zinc-200 mb-2">Custom Countries (Press Enter to add)</label>
											<div className="flex flex-wrap gap-2 mb-2">
												{getCustomCountries().map(tag => (
													<span key={tag} className="bg-purple-600/30 border border-purple-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
														{tag}
														<button type="button" onClick={() => handleCountryToggle(tag)} className="text-purple-300 hover:text-white">&times;</button>
													</span>
												))}
											</div>
											<Input
												placeholder="Type a country and press Enter"
												value={customCountryInput}
												onChange={(e) => {
													setCustomCountryInput(e.target.value);
													if (errors.countries) {
														setErrors((prev) => ({ ...prev, countries: "" }));
													}
												}}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														const val = toTitleCase(customCountryInput.trim());
														if (val && !formData.countries.includes(val)) {
															setFormData(p => ({ ...p, countries: [...p.countries, val] }));
														}
														setCustomCountryInput("");
														setErrors((prev) => ({ ...prev, countries: "" }));
													}
												}}
											/>
											{getCustomCountries().length > 0 && !customCountryInput.trim() && (
												<p className="mt-1 text-xs text-violet-400 flex items-center gap-1">
													<span>✓</span> {getCustomCountries().length} custom {getCustomCountries().length === 1 ? "country" : "countries"} added
												</p>
											)}
										</div>
									)}
									{errors.countries && (
										<p className="text-red-500 text-xs mt-1">
											{errors.countries}
										</p>
									)}
								</div>

								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<div className="flex justify-between items-center">
										<h3 className="text-lg font-bold text-white">
											Product Images
										</h3>
										<span className="text-xs text-zinc-400">
											{imageItems.length} / 10 added
										</span>
									</div>
									<div
										onDragEnter={onDragEnterBox}
										onDragOver={(e) => e.preventDefault()}
										onDragLeave={onDragLeaveBox}
										onDrop={onDropBox}
										onClick={() =>
											fileInputRef.current?.click()
										}
										className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragOver ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800"}`}
									>
										<UploadIcon className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
										<p className="text-white font-medium mb-1">
											Click or drag images here
										</p>
										<p className="text-zinc-500 text-sm mb-4">
											Ctrl+V to paste. Max 10 images,
											under 10MB each.
										</p>
										<input
											ref={fileInputRef}
											type="file"
											multiple
											accept="image/*"
											onChange={onFileChange}
											className="hidden"
										/>
									</div>
									{errors.images && (
										<p className="text-red-500 text-xs text-center">
											{errors.images}
										</p>
									)}
									{imageItems.length > 0 && (
										<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleImageDragEndDnd}>
											<SortableContext items={imageItems.map(i => i.id)} strategy={rectSortingStrategy}>
												<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
													{imageItems.map((img, idx) => (
														<SortableImageItem key={img.id} id={img.id} img={img} index={idx} removeImage={removeImage} setMain={setMain} />
													))}
												</div>
											</SortableContext>
										</DndContext>
									)}
								</div>

								{/* ── Product Videos ── */}
								<div className="space-y-4 pt-4 border-t border-zinc-800">
									<div className="flex justify-between items-center">
										<div>
											<h3 className="text-lg font-bold text-white">Product Videos</h3>
											<p className="text-xs text-zinc-500 mt-0.5">Optional · Max 3 videos · Up to 200 MB each</p>
										</div>
										<span className="text-xs text-zinc-400">{videoItems.length} / 3 added</span>
									</div>

									{videoItems.length < 3 && (
										<div
											onDragEnter={onVideoDragEnter}
											onDragOver={(e) => e.preventDefault()}
											onDragLeave={onVideoDragLeave}
											onDrop={onVideoDrop}
											onClick={() => videoFileInputRef.current?.click()}
											className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
												isVideoDragOver
													? "border-blue-500 bg-blue-500/10"
													: "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800"
											}`}
										>
											<svg className="mx-auto h-10 w-10 text-zinc-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
											</svg>
											<p className="text-white font-medium mb-1">Click or drag a video here</p>
											<p className="text-zinc-500 text-sm">MP4, WebM, MOV — max 200 MB</p>
											<input
												ref={videoFileInputRef}
												type="file"
												accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska"
												onChange={onVideoFileChange}
												className="hidden"
											/>
										</div>
									)}

									{errors.videos && (
										<p className="text-red-500 text-xs">{errors.videos}</p>
									)}

									{videoItems.length > 0 && (
										<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleVideoDragEndDnd}>
											<SortableContext items={videoItems.map(v => v.id)} strategy={verticalListSortingStrategy}>
												<div className="space-y-3 mt-2">
													{videoItems.map((vid, idx) => (
														<SortableVideoItem key={vid.id} id={vid.id} vid={vid} index={idx} removeVideo={removeVideo} setPrimaryVideo={setPrimaryVideo} />
													))}
												</div>
											</SortableContext>
										</DndContext>
									)}
								</div>

								<div className="pt-8">
									<Button
										type="submit"
										disabled={isWorking}
										className="w-full h-14 text-lg bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/20"
									>
										{isWorking
											? uploadingVideoCount > 0
												? `Uploading ${uploadingVideoCount} video(s)...`
												: uploadingCount > 0
												? `Uploading ${uploadingCount} image(s)...`
												: "Saving Product..."
											: editingId
												? "Update Product"
												: "Create Product"}
									</Button>
								</div>
							</form>
						</div>

						<div className="lg:col-span-1">
							<div className="sticky top-28 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
								<h3 className="text-lg font-bold text-white mb-4">
									Card Preview
								</h3>
								{!formData.title && !mainPreview ? (
									<div className="aspect-3/4 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-500 text-sm">
										Fill out form to see preview
									</div>
								) : (
									<div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
										<div className="aspect-square bg-zinc-800 relative">
											{mainPreview ? (
												<img
													src={
														mainPreview.previewUrl ||
														mainPreview.url
													}
													alt=""
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-zinc-600">
													No Image
												</div>
											)}
											<div className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
												{formData.animeTag === "Other"
													? customAnimeTag || "Anime"
													: formData.animeTag}
											</div>
											<div className="absolute top-3 right-3 bg-zinc-900 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-zinc-700">
												{formData.store}
											</div>
										</div>
										<div className="p-4">
											<h4 className="font-bold text-white line-clamp-2">
												{formData.title ||
													"Product Title"}
											</h4>
											<div className="mt-2 flex flex-wrap items-start justify-between gap-1">
												<div className="flex flex-col gap-1">
													<span className="bg-zinc-800 text-zinc-400 text-xs px-2.5 py-1 rounded">
														{formData.category}
													</span>
													{formData.subCategory && (
														<span className="bg-violet-900/40 text-violet-300 text-xs px-2.5 py-1 rounded border border-violet-800/50">
															{formData.subCategory}
														</span>
													)}
												</div>
												<span className="text-purple-400 font-bold">
													{CURRENCY_SYMBOL_MAP[formData.currency] && (
														<span className="mr-0.5">{CURRENCY_SYMBOL_MAP[formData.currency]}</span>
													)}
													{formData.currency}{" "}
													{formData.price || "0.00"}
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
	);
};

export default ProductForm;